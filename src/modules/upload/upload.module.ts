import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryAsset } from './entities/cloudinary-asset.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CloudinaryAsset, Portfolio])],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
