import { Injectable } from '@nestjs/common';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { readPrivateKey, readPublicKey } from '../../helper/file';

@Injectable()
export class JwtConfigService implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions {
    return {
      global: true,
      privateKey: readPrivateKey(),
      publicKey: readPublicKey(),
      signOptions: {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1d'),
        algorithm: 'RS256',
      },
    };
  }
}
