import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { District } from '../../schemas/district.schema';
import { ApiArrayResponse } from 'src/base/api/array-response';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller({ path: 'districts', version: '1' })
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheKey('districts')
  @CacheTTL(60 * 60 * 24 * 30)
  @Get()
  @ApiArrayResponse(District)
  async findAll() {
    return await this.districtsService.findAll(District.name, {});
  }
}
