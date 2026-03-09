import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const cookieSecret = configService.get<string>('JWT_SECRET') || 'default-secret';

  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:4200'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
  });
  
  // Cookie parser for reading signed/unsigned cookies
  app.use(cookieParser(cookieSecret));

  // Enable global validation using class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Register global filter and interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
