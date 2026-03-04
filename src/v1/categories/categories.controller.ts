import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { HttpExceptionDto } from 'src/base/dto/http-exception.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ParseObjectIdPipe } from 'src/pipes/parse-object-id.pipe';
import { Types } from 'mongoose';
import { Category } from 'src/schemas/category.schema';
import { Guest } from 'src/decorators/auth.decorator';

@ApiTags('Danh mục')
@Controller({
  version: '1',
  path: 'categories',
})
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Guest()
  @ApiOperation({ summary: 'Danh sách danh mục' })
  @ApiOkResponse({ type: Category, isArray: true })
  getAll(@Query() query: FilterCategoryDto) {
    return this.categoriesService.getAll(query);
  }

  @Get('hierarchical')
  @Guest()
  @ApiOperation({ summary: 'Danh sách danh mục' })
  @ApiOkResponse({ type: Category, isArray: true })
  getHierarchical(@Query() query: FilterCategoryDto) {
    return this.categoriesService.getHierarchical(query);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo danh mục' })
  @ApiOkResponse({ type: HttpExceptionDto })
  async create(@Body() body: CreateCategoryDto) {
    return await this.categoriesService.createCategory(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiOkResponse({ type: HttpExceptionDto })
  async update(
    @Param('id', ParseObjectIdPipe) categoryId: Types.ObjectId,
    @Body() body: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(categoryId, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiOkResponse({ type: HttpExceptionDto })
  async delete(@Param('id', ParseObjectIdPipe) categoryId: Types.ObjectId) {
    return await this.categoriesService.deleteCategory(categoryId);
  }
}
