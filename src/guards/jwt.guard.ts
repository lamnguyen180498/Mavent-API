import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_GUEST } from '../decorators/auth.decorator';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.session.isAuthenticated) return true;

    const isGuest = this.reflector.getAllAndOverride<boolean>(IS_GUEST, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isGuest) return true;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      return super.handleRequest(err, user, info, context);
    }

    return user;
  }
}
