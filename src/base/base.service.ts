import { Injectable } from '@nestjs/common';
import {
  CreateOptions,
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { PageMetaDto } from './dto/page-meta.dto';
import { PageDto } from './dto/page.dto';

@Injectable()
export class BaseService {
  private includeDeleted = false;
  private fieldDeletedAt = 'deleted_at';

  constructor(private readonly models: Record<string, Model<any>>) {}

  setFieldDeletedAt(name: string) {
    this.fieldDeletedAt = name;

    return this;
  }

  withTrashed() {
    this.includeDeleted = true;

    return this;
  }

  async paginate<T>(modelName: string, filter = {}, options?: QueryOptions<T>) {
    const model = this.getModel<T>(modelName);
    const finalFilter = this.includeDeleted
      ? filter
      : { ...filter, [this.fieldDeletedAt]: null };

    const entities = await model.find(
      finalFilter,
      options?.projection,
      options,
    );

    const itemCount = await model.countDocuments(finalFilter);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: options });

    return new PageDto(entities, pageMetaDto);
  }

  async findAll<T>(
    modelName: string,
    filter: FilterQuery<T>,
    options?: QueryOptions<T>,
  ) {
    const model = this.getModel<T>(modelName);
    return model.find(
      this.includeDeleted ? filter : { ...filter, [this.fieldDeletedAt]: null },
      options?.projection,
      options,
    );
  }

  async findOneById<T>(
    modelName: string,
    id: any,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ) {
    const model = this.getModel<T>(modelName);
    return model.findById(id, projection, options);
  }

  async findOneByCondition<T>(
    modelName: string,
    condition = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ) {
    const model = this.getModel<T>(modelName);
    return model.findOne(
      this.includeDeleted
        ? condition
        : { ...condition, [this.fieldDeletedAt]: null },
      projection,
      options,
    );
  }

  async create<T>(modelName: string, data: object) {
    const model = this.getModel<T>(modelName);
    return await model.create(data);
  }

  async createMany<T>(
    modelName: string,
    data: object[],
    options?: CreateOptions & { aggregateErrors: true },
  ) {
    const model = this.getModel<T>(modelName);
    return await model.create(data, options);
  }

  async update<T>(
    modelName: string,
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions,
  ) {
    const model = this.getModel<T>(modelName);
    return model.findOneAndUpdate(
      this.includeDeleted ? filter : { ...filter, [this.fieldDeletedAt]: null },
      update,
      {
        ...options,
        new: true,
      },
    );
  }

  async softDelete(modelName: string, id: any, options?: QueryOptions) {
    const model = this.getModel(modelName);
    const result = await model.findByIdAndUpdate(
      id,
      {
        [this.fieldDeletedAt]: new Date(),
      },
      options,
    );

    return !!result;
  }

  async forceDelete(
    modelName: string,
    id: any,
    options?: QueryOptions & { includeResultMetadata: true },
  ) {
    const model = this.getModel(modelName);
    const result = await model.findByIdAndDelete(id, options);
    return !!result;
  }

  private getModel<T>(name: string): Model<T> {
    const model = this.models[name];
    if (!model) {
      throw new Error(`Model ${name} not found.`);
    }
    return model;
  }

  async findOrCreate<T>(
    modelName: string,
    condition: Partial<T>,
    createData: Partial<T>,
    options?: QueryOptions<T>,
  ): Promise<{ doc: T; created: boolean }> {
    const model = this.getModel<T>(modelName);

    const finalCondition = this.includeDeleted
      ? condition
      : { ...condition, [this.fieldDeletedAt]: null };

    const existing = await model.findOne(finalCondition, null, options);

    if (existing) {
      return {
        doc: existing,
        created: false,
      };
    }

    const createdDoc = await model.create({
      ...createData,
    });

    return {
      doc: createdDoc,
      created: true,
    };
  }

}
