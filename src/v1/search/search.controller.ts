import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiTags } from '@nestjs/swagger';
import { Guest } from 'src/decorators/auth.decorator';

@ApiTags('Search')
@Controller({
  version: '1',
  path: 'search',
})
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Guest()
  create(@Query('q') q: string) {
    return this.searchService.search(q);
  }
}
