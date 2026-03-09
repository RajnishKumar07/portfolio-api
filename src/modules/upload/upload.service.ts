import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryAsset } from './entities/cloudinary-asset.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'portfolio_images',
          resource_type: 'auto' // Supports raw files like PDFs in addition to images
        },
        async (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            return reject(new InternalServerErrorException('Image upload failed'));
          }

          try {
            // Log the upload in our database tracker
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

  async deleteImage(url: string): Promise<boolean> {
    try {
      // Extract the Cloudinary public_id from the URL string. 
      // Example URL: https://res.cloudinary.com/cloud_name/raw/upload/v1234567/portfolio_images/xyz.pdf
      // or image/upload... 
      // The public ID is "portfolio_images/xyz" (includes folder name, without the extension)
      const parts = url.split('/');
      const fileWithExt = parts.pop(); // "xyz.pdf"
      const folder = parts.pop();      // "portfolio_images"
      if (!fileWithExt || !folder) return false;
      
      const fileName = fileWithExt.split('.')[0];
      const publicId = `${folder}/${fileName}`;

      // resource_type must be provided for deletion if it's not an image
      const isRaw = url.includes('/raw/upload/');
      const resourceType = isRaw ? 'raw' : 'image';

      const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return res.result === 'ok';
    } catch (error) {
      this.logger.error('Cloudinary deletion error:', error);
      return false; // Soft fail so we don't crash saving workflows if an image is missing
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOrphanedAssets() {
    this.logger.log('Starting Cloudinary orphaned asset cleanup cron job...');
    
    try {
      // 1. Get all assets we've ever uploaded
      const trackedAssets = await this.assetRepository.find();
      if (trackedAssets.length === 0) {
        this.logger.log('No assets to check. Ending cleanup.');
        return;
      }

      // 2. Fetch all current Portfolios
      const portfolios = await this.portfolioRepository.find({
        relations: ['personalInfo', 'projects'],
      });

      // 3. Extract all currently active URLs
      const activeUrls = new Set<string>();
      for (const p of portfolios) {
        if (p.personalInfo?.resumeUrl) {
          activeUrls.add(p.personalInfo.resumeUrl);
        }
        if (p.projects && p.projects.length > 0) {
          for (const proj of p.projects) {
            if (proj.imagePath) {
              activeUrls.add(proj.imagePath);
            }
          }
        }
      }

      // 4. Find the orphans
      const orphans = trackedAssets.filter(asset => !activeUrls.has(asset.url));
      
      this.logger.log(`Found ${orphans.length} orphaned assets out of ${trackedAssets.length} total.`);

      // 5. Purge Cloudinary AND the DB Tracker row safely
      for (const orphan of orphans) {
        this.logger.log(`Deleting orphan: ${orphan.publicId} (${orphan.url})`);
        try {
          // Instruct Cloudinary to delete the physical file
          await cloudinary.uploader.destroy(orphan.publicId, { resource_type: orphan.resourceType });
          
          // Delete our DB record for it
          await this.assetRepository.remove(orphan);
        } catch(delErr) {
          this.logger.error(`Failed to delete orphaned asset ${orphan.publicId}`, delErr);
        }
      }
      
      this.logger.log('Cleanup complete.');
    } catch (e) {
      this.logger.error('Fatal error during cleanup cron job', e);
    }
  }
}
