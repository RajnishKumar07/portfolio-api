import { Global, Module } from '@nestjs/common';
import { HandleJwtService } from './services/jwt.service';

@Global()
@Module({
  providers: [HandleJwtService],
  exports: [HandleJwtService],
})
export class SharedModule {}
