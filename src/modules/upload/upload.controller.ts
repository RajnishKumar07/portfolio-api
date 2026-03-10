import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile, UseGuards, BadRequestException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../../common/guards/auth.guard';

/**
 * Controller handling distinct file upload requests.
 * Uses `AuthGuard` to ensure only logged-in users can upload media to Cloudinary.
 */
@Controller('upload')
@UseGuards(AuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Accepts a multipart/form-data payload for uploading images or PDFs.
   * Leverages NestJS pipes to automatically reject dangerously large files (>10MB) 
   * or unsupported arbitrary file types (like scripts or executables).
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB mix limit
          new FileTypeValidator({ fileType: /^(image\/.*|application\/pdf)$/ }),
        ],
      }),
    ) file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('File is completely missing');
    }
    const uploadedUrl = await this.uploadService.uploadImage(file);
    return { url: uploadedUrl };
  }

}
