import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Response } from 'express';

@Injectable()
export class HandleJwtService {
  constructor(
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async createJWT(payload: any) {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }

  async isTokenValid(token: string) {
    return await this.jwtService.verifyAsync(token);
  }

  async attachCookiesToResponse(res: Response, user: any) {
    const token = await this.createJWT(user);
    const oneDay = 1000 * 60 * 60 * 24;
    
    const cookieConfig: CookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + oneDay),
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      signed: true,
    };

    await res.cookie('token', token, cookieConfig);
  }
}
