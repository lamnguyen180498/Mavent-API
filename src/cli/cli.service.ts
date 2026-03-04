import { Injectable } from '@nestjs/common';
import { Command } from '@squareboat/nest-console';
import { Model } from 'mongoose';
import { City } from '../schemas/city.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Ward } from '../schemas/ward.schema';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class CliService {
  constructor(
    @InjectModel(City.name) private readonly cityModel: Model<City>,
    @InjectModel(Ward.name) private readonly wardModel: Model<Ward>,
  ) {}
  //node cli sync:dvhcvn
  @Command('sync:dvhcvn', {
    desc: 'Cập nhật đơn vị hành chính',
  })
  async syncDVHC() {
    const filePath = path.join(process.cwd(), 'storage/app/public/dvhcvn.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    for (const province of jsonData) {
      const city = await this.cityModel.findOneAndUpdate(
        { code: province.code },
        {
          name: province.name,
          code: province.code,
        },
        { upsert: true, new: true },
      );

      const wardPromises = province.wards.map(
        (ward: { ward_code: string; name: string }) =>
          this.wardModel.findOneAndUpdate(
            { code: ward.ward_code },
            {
              $set: {
                name: ward.name,
                code: ward.ward_code,
                city_id: city._id,
              },
            },
            { upsert: true, new: true },
          ),
      );

      await Promise.all(wardPromises);
    }
    console.log('Cập nhật đơn vị hành chính thành công');
  }
}
