import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Database Tracker for all files uploaded to Cloudinary.
 * Used exclusively by the midnight Cron Job (`cleanupOrphanedAssets`) to identify 
 * and physically delete orphaned media blobs that are no longer linked to an active Portfolio.
 */
@Entity('cloudinary_assets')
export class CloudinaryAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  publicId: string;

  @Column()
  url: string;

  @Column({ default: 'image' })
  resourceType: string;

  @CreateDateColumn()
  createdAt: Date;
}
