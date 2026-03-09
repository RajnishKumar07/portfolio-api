import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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
