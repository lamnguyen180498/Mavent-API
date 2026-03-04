import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag, TagDocument } from '../../schemas/tag.schema';

@Injectable()
export class TagsService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<TagDocument>) {}

  async create(
    createTagDto: CreateTagDto,
    userId: Types.ObjectId,
  ): Promise<Tag> {
    const createdTag = new this.tagModel({ ...createTagDto, user_id: userId });
    return createdTag.save();
  }

  async findAll(userId: Types.ObjectId): Promise<Tag[]> {
    return this.tagModel.find({ user_id: userId }).exec();
  }

  async findOne(id: string): Promise<Tag> {
    return this.tagModel.findById(id).exec();
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    return this.tagModel
      .findByIdAndUpdate(id, updateTagDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Tag> {
    return this.tagModel.findByIdAndDelete(id).exec();
  }
}
