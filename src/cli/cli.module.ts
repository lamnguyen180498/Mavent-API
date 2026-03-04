import { Module } from '@nestjs/common';
import { CliService } from './cli.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { City, CitySchema } from '../schemas/city.schema';
import { Ward, WardSchema } from '../schemas/ward.schema';

@Module({
  providers: [CliService],
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: City.name,
        schema: CitySchema,
      },
      {
        name: Ward.name,
        schema: WardSchema,
      },
    ]),
  ],
})
export class CliModule {}
