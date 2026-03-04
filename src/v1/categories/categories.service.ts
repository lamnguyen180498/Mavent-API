import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Category } from '../../schemas/category.schema';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { HttpStatusCode } from 'axios';
import slug from 'slug';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService extends BaseService {
  logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectConnection() private readonly connection: Connection,
  ) {
    super({
      [Category.name]: categoryModel,
    });
  }

  async getAll(query: FilterCategoryDto) {
    const filter: any = {};
    if (query.name) filter.name = { $regex: query.name, $options: 'i' };

    const categories = await this.categoryModel
      .find(filter)
      .sort({ order: 1, updated_at: -1, _id: 1 })
      .lean();

    return categories;
  }

  async getHierarchical(query: FilterCategoryDto) {
    const filter: any = {};

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    const allCategories = await this.categoryModel
      .find(filter)
      .sort({ order: 1, updated_at: -1, _id: 1 })
      .lean()
      .exec();

    if (query.name) {
      return allCategories;
    }

    const result = this.buildTree(allCategories, null);
    return result;
  }

  private buildTree(
    categories: (Category & { _id: Types.ObjectId })[],
    parentId: Types.ObjectId | null = null,
  ) {
    return categories
      .filter((category) => {
        const catParentId = category.parent_id?.toString() || null;
        const currentParentId = parentId?.toString() || null;
        return catParentId === currentParentId;
      })
      .map((category) => {
        const children = this.buildTree(categories, category._id);
        return {
          ...category,
          children,
        };
      });
  }

  async createCategory(body: CreateCategoryDto) {
    const { name, parent_id, description } = body;

    const existingCategory = await this.categoryModel
      .findOne({ $or: [{ name }, { slug: slug(name) }] })
      .lean();
    if (existingCategory) {
      throw new HttpException('Danh mục đã tồn tại', HttpStatusCode.Conflict);
    }
    const createData: Category = {
      name,
      description,
      slug: slug(name),
      order: 0,
    };

    if (parent_id) {
      const parentCategory = await this.categoryModel
        .findById(parent_id)
        .lean();
      if (!parentCategory) {
        throw new HttpException(
          'Danh mục cha không tồn tại',
          HttpStatusCode.NotFound,
        );
      }
      createData.parent_id = parentCategory._id;
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.categoryModel.create([createData], { session });
      await session.commitTransaction();
      return {
        statusCode: HttpStatus.OK,
        message: 'Thêm danh mục mới thành công',
      };
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

  async updateCategory(categoryId: Types.ObjectId, body: UpdateCategoryDto) {
    const { name, parent_id, description } = body;

    const updateCategory = await this.categoryModel.findById(categoryId).exec();
    updateCategory.name = name;
    updateCategory.slug = slug(name);
    updateCategory.description = description;

    if (parent_id) {
      const parentCategory = await this.categoryModel
        .findById(parent_id)
        .lean();
      if (!parentCategory) {
        throw new HttpException(
          'Danh mục cha không tồn tại',
          HttpStatusCode.NotFound,
        );
      }
      updateCategory.parent_id = parentCategory._id;
      updateCategory.updated_at = new Date();
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await updateCategory.save({ session });
      await session.commitTransaction();
      return {
        statusCode: HttpStatus.OK,
        message: 'Cập nhật danh mục mới thành công',
      };
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

  async deleteCategory(categoryId: Types.ObjectId) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const childCategories = await this.categoryModel.find({
        parent_id: categoryId,
      });
      const childCategoryIds = childCategories.map((c) => c._id);
      await this.categoryModel.deleteMany(
        { _id: { $in: [...childCategoryIds, categoryId] } },
        { session },
      );
      await session.commitTransaction();
      return {
        statusCode: HttpStatus.OK,
        message: 'Xóa danh mục thành công',
      };
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
}
