import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile, UseGuards, BadRequestException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('upload')
@UseGuards(AuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

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
