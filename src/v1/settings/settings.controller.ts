import { Body, Controller, Get, Post } from '@nestjs/common';
import { Guest } from '../../decorators/auth.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Setting } from '../../schemas/setting.schema';
import { Model } from 'mongoose';
import { CreateSettingDto } from './dto/create-setting.dto';

@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<Setting>,
  ) {}

  @Guest()
  @Get()
  async show() {
    return this.settingModel.findOne();
  }

  @Post()
  async create(@Body() data: CreateSettingDto) {
    return this.settingModel.findOneAndUpdate({}, data, {
      new: true,
      upsert: true,
    });
  }
}
