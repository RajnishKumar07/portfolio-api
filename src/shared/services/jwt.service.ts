import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Response } from 'express';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class HandleJwtService {
  constructor(
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async createJWT(payload: JwtPayload) {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }

  async isTokenValid(token: string) {
    return await this.jwtService.verifyAsync(token);
  }

  async attachCookiesToResponse(res: Response, user: JwtPayload) {
    const token = await this.createJWT(user);
    const oneDay = 1000 * 60 * 60 * 24;
    
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    const cookieConfig: CookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: isProduction,          // Must be true for cross-origin HTTPS
      sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-site cookies
      signed: true,
    };

    await res.cookie('token', token, cookieConfig);
  }
}
