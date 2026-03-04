import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from '../../schemas/setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Setting.name,
        schema: SettingSchema,
      },
    ]),
  ],
  controllers: [SettingsController],
})
export class SettingsModule {}
