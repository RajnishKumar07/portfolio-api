import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleJwtService } from '../../shared/services/jwt.service';

/**
 * Permissive Authentication Guard.
 * Attempts to validate a JWT cookie if present to attach user identity, 
 * but safely ignores failures and simply proceeds anonymously if no valid token exists.
 * Heavily used for public viewing routes (e.g. view Portfolio by Slug).
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: HandleJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      return true; // Proceed without attaching user
    }

    await this.safelyAttachPayloadFromToken(token, request);
    return true;
  }

  /**
   * Isolates the logical OR (||) fallback sequence to cleanly locate the token
   * from signed or unsigned cookies, drastically lowering the guard's cyclomatic complexity.
   */
  private extractToken(request: Request): string | undefined {
    if (request.signedCookies && request.signedCookies.token) {
      return request.signedCookies.token;
    }
    if (request.cookies && request.cookies.token) {
      return request.cookies.token;
    }
    return undefined;
  }

  /**
   * Attempts to parse the JWT securely. Safely ignores expired/invalid tokens 
   * to allow the anonymous pass-through required by `OptionalAuthGuard`.
   */
  private async safelyAttachPayloadFromToken(token: string, request: Request): Promise<void> {
    try {
      const payload = await this.jwtService.isTokenValid(token);
      request['user'] = payload;
    } catch (error) {
      // Ignore invalid token and allow proceeding anonymously
    }
  }
}
