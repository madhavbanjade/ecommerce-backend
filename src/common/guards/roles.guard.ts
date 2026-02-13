import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ErrorHandler } from '../handlers/error.handler.js';

@Injectable()
export class RoleProtectGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    if (!user) {
      throw ErrorHandler.unauthorized('User missing');
    }

    if (user.role !== 'admin') {
      throw ErrorHandler.unauthorized('Only Admin can access!!');
    }

    return true;
  }
}
