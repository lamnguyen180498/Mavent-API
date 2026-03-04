import { Module } from '@nestjs/common';
import { SubscribeService } from './subscribe.service';
import { SubscribeController } from './subscribe.controller';
import { MongooseModule } from '@nestjs/mongoose';

import { Subscribe, SubscribeSchema } from '../../schemas/subscribe.schema';
import { ExportExcelService } from '../export-excel/export-excel.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscribe.name, schema: SubscribeSchema },
    ]),
  ],
  controllers: [SubscribeController],
  providers: [SubscribeService, ExportExcelService],
  exports: [ExportExcelService],
})
export class SubscribeModule {}
