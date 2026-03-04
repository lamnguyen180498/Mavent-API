import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { JwtGuard } from '../../guards/jwt.guard';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../../guards/roles.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AuthProcessor } from './auth.processor';
import { HttpModule } from '@nestjs/axios';
import { JwtRefreshTokenStrategy } from '../jwt/jwt-refresh-token.strategy';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    HttpModule,
    UsersModule,
    PassportModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    BullModule.registerQueue({
      name: 'auth',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AuthProcessor,
  ],
  exports: [AuthService],
})
export class AuthModule {}
