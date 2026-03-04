import { Module } from '@nestjs/common';
import { WardsService } from './wards.service';
import { WardsController } from './wards.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ward, WardSchema } from '../../schemas/ward.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ward.name, schema: WardSchema }]),
  ],
  controllers: [WardsController],
  providers: [WardsService],
})
export class WardsModule {}
