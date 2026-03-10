import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryAsset } from './entities/cloudinary-asset.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Service orchestrating cloud file storage via Cloudinary and local database tracking.
 * Includes a scheduled Cron job ensuring cloud repository hygiene by permanently 
 * sweeping any unused/orphaned files.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(CloudinaryAsset)
    private readonly assetRepository: Repository<CloudinaryAsset>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Uploads a raw buffer file explicitly to Cloudinary's secure tier.
   * If successful, records the unique Cloudinary `public_id` and URL in the local
   * `CloudinaryAsset` tracker database table so the Cron sweep can monitor its lifecycle.
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      // 1. Open a writable stream directly to Cloudinary's infrastructure
      cloudinary.uploader.upload_stream(
        { 
          folder: 'portfolio_images',
          // 'auto' allows Cloudinary to dynamically sniff the buffer and accept PDFs natively alongside images without breaking
          resource_type: 'auto' 
        },
        async (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            return reject(new InternalServerErrorException('Image upload failed'));
          }

          try {
            // 2. Synchronize the successful cloud upload with our local database tracker
            // This ensures our nightly Cron job knows this asset exists and can gracefully delete it if it later becomes orphaned
            const asset = this.assetRepository.create({
              publicId: result.public_id,
              url: result.secure_url,
              resourceType: result.resource_type === 'raw' ? 'raw' : 'image',
            });
            await this.assetRepository.save(asset);
            
            resolve(result.secure_url);
          } catch(dbErr) {
            this.logger.error('Failed to log Cloudinary asset in DB:', dbErr);
            resolve(result.secure_url); // Still resolve if db logging fails
          }
        },
      ).end(file.buffer);
    });
  }

  /**
   * Orchestrates the deletion of a specific Cloudinary asset by its raw URL.
   */
  async deleteImage(url: string): Promise<boolean> {
    try {
      const publicId = this.extractPublicIdFromUrl(url);
      if (!publicId) return false;

      const resourceType = this.determineResourceType(url);
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return res.result === 'ok';
    } catch (error) {
      this.logger.error('Cloudinary deletion error:', error);
      return false; // Soft fail so we don't crash saving workflows if an image is missing
    }
  }

  /**
   * Helper extracting string identifiers required for Cloudinary API deletion payloads.
   */
  private extractPublicIdFromUrl(url: string): string | null {
    const parts = url.split('/');
    const fileWithExt = parts.pop();
    const folder = parts.pop();
    
    if (!fileWithExt || !folder) {
      return null;
    }
      
    const fileName = fileWithExt.split('.')[0];
    return `${folder}/${fileName}`;
  }

  /**
   * Determines if the remote Cloudinary asset is a raw PDF payload or native image payload.
   */
  private determineResourceType(url: string): string {
    return url.includes('/raw/upload/') ? 'raw' : 'image';
  }

  /**
   * Scheduled task running exactly at midnight server time.
   * 1. Fetches all historical successful Cloudinary uploads logged in the `CloudinaryAsset` table.
   * 2. Scans every single active `Portfolio` in the database for `resumeUrl` and `imagePath` usage.
   * 3. Performs a Set-diff to find orphaned links.
   * 4. Physically commands Cloudinary to delete the stranded blobs, then wipes the local tracker record.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOrphanedAssets() {
    this.logger.log('Starting Cloudinary orphaned asset cleanup cron job...');
    
    try {
      const trackedAssets = await this.assetRepository.find();
      if (trackedAssets.length === 0) {
        this.logger.log('No assets to check. Ending cleanup.');
        return;
      }

      const portfolios = await this.portfolioRepository.find({
        relations: ['personalInfo', 'projects'],
      });

      const activeUrls = this.extractAllActiveUrls(portfolios);
      const orphans = trackedAssets.filter(asset => !activeUrls.has(asset.url));
      
      this.logger.log(`Found ${orphans.length} orphaned assets out of ${trackedAssets.length} total.`);

      for (const orphan of orphans) {
        await this.purgeOrphanSafely(orphan);
      }
      
      this.logger.log('Cleanup complete.');
    } catch (e) {
      this.logger.error('Fatal error during cleanup cron job', e);
    }
  }

  /**
   * Scans the active Portfolio structures extracting any strings mapping to DB tracking.
   */
  private extractAllActiveUrls(portfolios: Portfolio[]): Set<string> {
    const activeUrls = new Set<string>();
    
    for (const p of portfolios) {
      this.addResumeIfPresent(p, activeUrls);
      this.addProjectImagesIfPresent(p, activeUrls);
    }
    
    return activeUrls;
  }

  private addResumeIfPresent(p: Portfolio, activeUrls: Set<string>): void {
    if (p.personalInfo && p.personalInfo.resumeUrl) {
      activeUrls.add(p.personalInfo.resumeUrl);
    }
  }

  private addProjectImagesIfPresent(p: Portfolio, activeUrls: Set<string>): void {
    if (p.projects && Array.isArray(p.projects)) {
      for (const proj of p.projects) {
        if (proj.imagePath) {
          activeUrls.add(proj.imagePath);
        }
      }
    }
  }

  /**
   * Executes the physical Cloudinary deletion payload and strips the local MariaDB tracking row.
   */
  private async purgeOrphanSafely(orphan: CloudinaryAsset): Promise<void> {
    this.logger.log(`Deleting orphan: ${orphan.publicId} (${orphan.url})`);
    try {
      await cloudinary.uploader.destroy(orphan.publicId, { resource_type: orphan.resourceType });
      await this.assetRepository.remove(orphan);
    } catch(delErr) {
      this.logger.error(`Failed to delete orphaned asset ${orphan.publicId}`, delErr);
    }
  }
}
