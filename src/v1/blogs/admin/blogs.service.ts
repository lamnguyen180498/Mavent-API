import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';
import { uploadFile, validateImageFile } from 'src/helper/common';
import slug from 'slug';
import { UserDocument } from 'src/schemas/user.schema';
import { BaseService } from 'src/base/base.service';
import { Blog, BlogDocument } from 'src/schemas/blog.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { FilterBlogDto } from '../dto/filter-blog.dto';
import { pipePagination } from 'src/helper/pagination';

@Injectable()
export class AdminBlogsService extends BaseService {
  logger = new Logger(AdminBlogsService.name);

  constructor(@InjectModel(Blog.name) private readonly blogModel: Model<Blog>) {
    super({
      [Blog.name]: blogModel,
    });
  }

  async createBlog(
    createBlogDto: CreateBlogDto,
    user: UserDocument,
    thumbnail?: Express.Multer.File,
  ) {
    createBlogDto.slug ??= slug(createBlogDto.title);
    createBlogDto.seo = {
      title: createBlogDto.title,
    };
    createBlogDto.owner_id = user._id;
    const session = await this.blogModel.startSession();
    session.startTransaction();
    try {
      if (createBlogDto.is_featured) {
        await this.blogModel.updateMany(
          { is_featured: true },
          { $set: { is_featured: false } },
          { session },
        );
      }
      const newBlog = await this.blogModel.create([createBlogDto], { session });
      const blogDoc = newBlog[0];
      if (thumbnail) {
        validateImageFile(thumbnail, 'thumbnail');
        blogDoc.thumbnail = await uploadFile(
          thumbnail,
          `${blogDoc._id.toString()}-thumbnail`,
          'thumbnails',
        );
      }
      await blogDoc.save({ session });
      await session.commitTransaction();
      return blogDoc;
    } catch (e) {
      this.logger.error(e);
      await session.abortTransaction();
      throw new HttpException(
        e.message.startsWith('E11000') ? 'URL đã tồn tại' : e.message,
        500,
      );
    } finally {
      await session.endSession();
    }
  }

  async findAllBlog(query: FilterBlogDto) {
    const match = {};

    if (query.category_id) {
      match['category_id'] = query.category_id;
    }

    if (query.keyword) {
      match['title'] = { $regex: query.keyword, $options: 'i' };
    }

    if (query.status !== undefined) {
      match['status'] = query.status;
    }

    if (query.from_date && query.to_date) {
      match['created_at'] = {
        $gte: new Date(query.from_date),
        $lte: new Date(query.to_date),
      };
    } else if (query.from_date) {
      match['created_at'] = { $gte: new Date(query.from_date) };
    } else if (query.to_date) {
      match['created_at'] = { $lte: new Date(query.to_date) };
    }

    if (query.exclude_featured) {
      match['is_featured'] = false;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $sort: { is_featured: -1, created_at: -1 },
      },
      ...pipePagination(query.page, query.limit),
    ];

    const blogs = await this.blogModel.aggregate(pipeline);
    return blogs.shift();
  }

  async findOne(id: Types.ObjectId): Promise<Blog> {
    const blog = await this.blogModel.findById(id).exec();
    if (!blog) {
      throw new NotFoundException(`Không tìm thấy blog với ID: ${id}`);
    }
    return blog;
  }

  async updateBlog(
    id: Types.ObjectId,
    updateBlogDto: UpdateBlogDto,
    thumbnail?: Express.Multer.File,
  ): Promise<BlogDocument> {
    const session = await this.blogModel.startSession();
    session.startTransaction();
    try {
      const blog = await this.blogModel.findById(id);

      if (updateBlogDto.is_featured && !blog.is_featured) {
        await this.blogModel.updateMany(
          { is_featured: true, _id: { $ne: id } },
          { $set: { is_featured: false } },
          { session },
        );
      }

      if (thumbnail) {
        validateImageFile(thumbnail, 'thumbnail');
        updateBlogDto.thumbnail = await uploadFile(
          thumbnail,
          `${blog._id}-thumbnail`,
          'thumbnails',
        );
      }

      Object.assign(blog, updateBlogDto);
      const savedBlog = await blog.save({ session });
      await session.commitTransaction();
      return savedBlog;
    } catch (e) {
      this.logger.error(e);
      await session.abortTransaction();
      throw new HttpException(
        'Có lỗi xảy ra, vui lòng thử lại',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async removeBlog(id: Types.ObjectId): Promise<any> {
    const result = await this.blogModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Không tìm thấy blog với ID: ${id}`);
    }
    return { message: 'Blog đã được xóa thành công' };
  }
}
