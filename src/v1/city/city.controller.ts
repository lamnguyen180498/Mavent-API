import { Controller, Get } from '@nestjs/common';
import { CityService } from './city.service';
import { City } from '../../schemas/city.schema';
import { ApiArrayResponse } from '../../base/api/array-response';
import { Guest } from '../../decorators/auth.decorator';

@Controller({ path: 'cities', version: '1' })
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @Guest()
  @ApiArrayResponse(City)
  findAll() {
    return this.cityService.findAll(City.name, {});
  }
}
