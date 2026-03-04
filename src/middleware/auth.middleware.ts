import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../v1/users/users.service';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async use(
    req: Request & { user?: UserDocument },
    res: Response,
    next: NextFunction,
  ) {
    const { user } = await this.resolveSession(req);
    // ghi đè request nếu session tồn tại
    req['user'] = user;

    const { user: newUser, overwrite } =
      await this.resolveAuthorizationBearer(req);

    // ưu tiên token được gửi từ header
    if (overwrite) {
      req['user'] = newUser;
    }

    next();
  }

  private async resolveAuthorizationBearer(
    req: Request & { user?: UserDocument },
  ) {
    const result = { user: null, overwrite: false };
    const authorizationHeader = req.headers['authorization'];

    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.substring(7);

      try {
        const payload = this.jwtService.decode(token);
        result.overwrite = true;

        if (typeof payload === 'object' && payload?.sub) {
          if (req.user?._id.toString() === payload.sub) {
            result.user = req.user;
          } else {
            result.user = await this.usersService.findById(payload.sub);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }

    return result;
  }

  private async resolveSession(
    req: Request & {
      session: {
        isAuthenticated?: boolean;
        userId?: string;
      };
    },
  ) {
    const result = { site: null, user: null };
    if (req.session.isAuthenticated) {
      if (req.session.userId) {
        result.user = await this.usersService.findById(req.session.userId);
      }
    }

    return result;
  }
}
