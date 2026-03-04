import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { City } from '../../schemas/city.schema';

@Injectable()
export class CityService extends BaseService {
  constructor(@InjectModel(City.name) private readonly cityModel: Model<City>) {
    super({ [City.name]: cityModel });
  }
}
