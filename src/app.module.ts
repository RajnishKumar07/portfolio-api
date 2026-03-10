import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './modules/users/users.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * The root module of the application.
 * Bootstraps standard configuration systems (ConfigModule), database ORM connections (TypeOrmModule),
 * Chron scheduling (ScheduleModule), and integrates all domain-specific feature modules like Portfolio and Uploads.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Initializes Cron job architecture across the app
    ConfigModule.forRoot({
      isGlobal: true, // Makes Env vars accessible globally without re-importing the module
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'portfolio_db',
      autoLoadEntities: true, // Automatically registers imported TypeORM @Entity classes
      synchronize: true, // Auto-syncs schema changes to MariaDB (Not recommended for Production)
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
      global: true, // Global JWT configuration, injectable into AuthGuard everywhere
    }),
    UsersModule,
    PortfolioModule,
    SharedModule,
    AuthModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
