import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { readPublicKey } from '../../helper/file';
import { JwtInterface } from './jwt.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
