import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
} from '@nestjs/common';
import { AdminBlogsService } from './blogs.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserDocument } from 'src/schemas/user.schema';
import { Types } from 'mongoose';
import { FilterBlogDto } from '../dto/filter-blog.dto';

@ApiTags('Blogs')
@ApiBearerAuth()
@Controller({
  path: 'admin/blogs',
  version: '1',
})
export class AdminBlogsController {
  constructor(private readonly adminBlogsService: AdminBlogsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết' })
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(
    @Body() createBlogDto: CreateBlogDto,
    @Req() req: { user: UserDocument },
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return this.adminBlogsService.createBlog(
      createBlogDto,
      req.user,
      thumbnail,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách bài viết' })
  findAll(@Query() query: FilterBlogDto) {
    return this.adminBlogsService.findAllBlog(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bài viết' })
  findOne(@Param('id') id: Types.ObjectId) {
    return this.adminBlogsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @UseInterceptors(FileInterceptor('thumbnail'))
  update(
    @Param('id') id: Types.ObjectId,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return this.adminBlogsService.updateBlog(id, updateBlogDto, thumbnail);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài viết' })
  remove(@Param('id') id: Types.ObjectId) {
    return this.adminBlogsService.removeBlog(id);
  }
}
