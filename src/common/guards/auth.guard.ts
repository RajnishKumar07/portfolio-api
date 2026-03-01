import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleJwtService } from '../../shared/services/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: HandleJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Cookie parser attaches signed cookies under signedCookies
    const { token } = request.signedCookies || request.cookies;

    if (!token) {
      throw new UnauthorizedException('Authentication Invalid');
    }

    try {
      const payload = await this.jwtService.isTokenValid(token);
      request['user'] = payload; // Attach user info to the request pipeline
      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication Invalid');
    }
  }
}
