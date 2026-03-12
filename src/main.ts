import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

/**
 * Bootstraps the NestJS application instance.
 * Configures global middleware, CORS policies, validation pipes, and exception filters.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const cookieSecret = configService.get<string>('JWT_SECRET') || 'default-secret';

  // Prefix all routes with '/api' (e.g., http://localhost:3000/api/portfolio)
  app.setGlobalPrefix('api'); // trigger hot-reload for new .env variables

  // Enable Cross-Origin Resource Sharing (CORS) strictly for the local Angular frontend
  app.enableCors({
    origin: ['http://localhost:4200'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Required to allow cookies to be passed cross-origin
  });
  
  // Initialize Cookie Parser for reading securely signed HTTP-only cookies (used for authentication AuthGuard)
  app.use(cookieParser(cookieSecret));

  // Enable global validation using class-validator and class-transformer
  // Automatically transforms incoming JSON payloads into strongly-typed DTO class instances
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Register global filter for standardized JSON error responses
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Register global interceptor for mapping all successful responses to `{ data: ... }` format
  app.useGlobalInterceptors(new TransformInterceptor());

  // Bind to 0.0.0.0 to ensure the server accepts connections from all external network interfaces (crucial for Docker/WSL setups)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
