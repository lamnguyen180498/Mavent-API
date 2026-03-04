import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { Ward } from '../../schemas/ward.schema';
import { Model } from 'mongoose';

@Injectable()
export class WardsService extends BaseService {
  constructor(@InjectModel(Ward.name) private readonly wardModel: Model<Ward>) {
    super({ [Ward.name]: wardModel });
  }
}
