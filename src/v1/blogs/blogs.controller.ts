import { Controller, Get, Param, Query, Ip } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Blog, BlogStatusEnum } from 'src/schemas/blog.schema';
import { Guest } from 'src/decorators/auth.decorator';
import { FilterBlogDto } from './dto/filter-blog.dto';
import { Types } from 'mongoose';

@ApiTags('Blogs')
@Controller({
  path: 'blogs',
  version: '1',
})
@Guest()
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bài viết' })
  async getAll(@Query() query: FilterBlogDto) {
    return this.blogsService.findAllBlog(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Bài viết nổi bật' })
  async getFeatured() {
    return this.blogsService.findOneByCondition(Blog.name, {
      is_featured: true,
      status: BlogStatusEnum.Public,
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Chi tiết bài viết' })
  async findBlog(
    @Param('slug') slug: string,
    @Query('increment_view') incrementView?: boolean,
    @Ip() ip?: string,
  ) {
    const condition: any[] = [{ slug }];
    if (Types.ObjectId.isValid(slug)) {
      condition.push({ _id: new Types.ObjectId(slug) });
    }
    const blog = await this.blogsService.findOneByCondition(Blog.name, {
      $or: condition,
    });
    if (!blog) return null;

    if (incrementView) {
      this.blogsService.incrementViews(blog._id.toString(), ip);
      // Optimistic update for the response object
      // blog.views = (blog.views || 0) + 1; // Optional, strict consistency might not be needed
    }

    await blog.populate([
      { path: 'owner', select: '_id full_name' },
      { path: 'category', select: '_id name' },
      { path: 'courses', select: '_id title thumbnail' },
    ]);

    return blog;
  }
}
