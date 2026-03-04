import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { UsersController } from './users.controller';
import {
  RevokeToken,
  RevokeTokenSchema,
} from '../../schemas/revoke-token.schema';
import { HttpModule } from '@nestjs/axios';
import { City, CitySchema } from '../../schemas/city.schema';
import { District, DistrictSchema } from '../../schemas/district.schema';
import { Ward, WardSchema } from '../../schemas/ward.schema';
import { Role, RoleSchema } from 'src/schemas/role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: City.name, schema: CitySchema },
      { name: District.name, schema: DistrictSchema },
      { name: Ward.name, schema: WardSchema },
      { name: RevokeToken.name, schema: RevokeTokenSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    HttpModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
