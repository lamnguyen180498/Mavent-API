import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { WardsService } from './wards.service';
import { Ward } from '../../schemas/ward.schema';
import { ApiArrayResponse } from 'src/base/api/array-response';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller({ path: 'wards', version: '1' })
export class WardsController {
  constructor(private readonly wardsService: WardsService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheKey('wards')
  @CacheTTL(60 * 60 * 24 * 30)
  @Get()
  @ApiArrayResponse(Ward)
  async findAll() {
    return await this.wardsService.findAll(Ward.name, {});
  }
}
