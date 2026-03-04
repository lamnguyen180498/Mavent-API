import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { readPublicKey } from '../../helper/file';
import { JwtInterface } from './jwt.interface';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: readPublicKey(),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtInterface) {
    const { sub, iat, exp } = payload;
    const user = await this.usersService.validUser(sub, iat, exp);

    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
