import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleJwtService } from '../../shared/services/jwt.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: HandleJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { token } = request.signedCookies || request.cookies || {};

    if (!token) {
      return true; // Proceed without attaching user
    }

    try {
      const payload = await this.jwtService.isTokenValid(token);
      request['user'] = payload;
    } catch (error) {
      // Ignore invalid token and allow proceeding anonymously
    }
    return true;
  }
}
