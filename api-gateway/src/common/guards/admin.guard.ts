import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only Administrators are authorized to perform this action',
      );
    }
    return true;
  }
}
