import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Model, PipelineStage } from 'mongoose';
import { BaseService } from 'src/base/base.service';
import { pipePagination } from 'src/helper/pagination';
import { Blog, BlogStatusEnum } from 'src/schemas/blog.schema';
import { FilterBlogDto } from './dto/filter-blog.dto';

@Injectable()
export class BlogsService extends BaseService {
  constructor(
    @InjectModel(Blog.name) private readonly blogModel: Model<Blog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      [Blog.name]: blogModel,
    });
  }

  async findAllBlog(query: FilterBlogDto) {
    const match = {
      status: BlogStatusEnum.Public,
    };

    if (query.category_id) {
      match['category_id'] = query.category_id;
    }

    if (query.keyword) {
      match['title'] = { $regex: query.keyword, $options: 'i' };
    }

    if (query.exclude_featured) {
      match['is_featured'] = { $ne: true };
    }

    const pipeline: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $sort: { created_at: -1 },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      ...pipePagination(query.page, query.limit),
    ];

    const blogs = await this.blogModel.aggregate(pipeline);
    return blogs.shift();
  }

  async incrementViews(id: string, ip: string) {
    const key = `view_count:${id}:${ip}`;
    const isViewed = await this.cacheManager.get(key);
    if (isViewed) return;

    await this.cacheManager.set(key, true, 24 * 60 * 60 * 1000); // 24h
    return this.blogModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }
}
