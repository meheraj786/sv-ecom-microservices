import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.token; // Extract cookie token securely

    if (!token) {
      throw new UnauthorizedException(
        'Authentication token is missing. Please login first.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload; // Attach payload user parameters to req
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired session token');
    }
  }
}
