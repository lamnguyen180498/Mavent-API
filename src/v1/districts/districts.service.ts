import { Injectable } from '@nestjs/common';
import { District } from '../../schemas/district.schema';
import { InjectModel } from '@nestjs/mongoose';
import { BaseService } from '../../base/base.service';
import { Model } from 'mongoose';

@Injectable()
export class DistrictsService extends BaseService {
  constructor(@InjectModel(District.name) private readonly districtModel: Model<District>) {
    super({ [District.name]: districtModel });
  }
}
