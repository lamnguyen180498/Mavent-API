import { Injectable, Res } from '@nestjs/common';
import { CreateSubscribeDto } from './dto/create-subscribe.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Subscribe } from '../../schemas/subscribe.schema';
import { FindSubscribeDto } from './dto/find-subscribe.dto';
import { pipePagination } from '../../helper/pagination';
import { ExportSubscribeDto } from './dto/export-subscribe.dto';
import { ExportExcelService } from '../export-excel/export-excel.service';
import dayjs from 'dayjs';
import { Response } from 'express';
@Injectable()
export class SubscribeService {
  constructor(
    @InjectModel(Subscribe.name)
    private readonly subscribeModel: Model<Subscribe>,
    private readonly exportExcelService: ExportExcelService,
  ) {}

  async create(createSubscribeDto: CreateSubscribeDto) {
    return await this.subscribeModel.create(createSubscribeDto);
  }

  async findAll(query: FindSubscribeDto) {
    const andConditions: any[] = [];

    if (query.keyword) {
      andConditions.push({
        $or: [
          { full_name: { $regex: query.keyword, $options: 'i' } },
          { email: { $regex: query.keyword, $options: 'i' } },
          { phone: { $regex: query.keyword, $options: 'i' } },
        ],
      });
    }

    if (query.from_date && query.to_date) {
      andConditions.push({
        created_at: {
          $gte: new Date(query.from_date),
          $lte: new Date(query.to_date),
        },
      });
    } else if (query.from_date) {
      andConditions.push({
        created_at: { $gte: new Date(query.from_date) },
      });
    } else if (query.to_date) {
      andConditions.push({
        created_at: { $lte: new Date(query.to_date) },
      });
    }
    if (query.source) {
      andConditions.push({ source: query.source });
    }

    const matchStage: PipelineStage.Match = {
      $match: andConditions.length > 0 ? { $and: andConditions } : {},
    };
    const pipeline: PipelineStage[] = [
      matchStage,
      { $sort: { created_at: -1 } },
      ...pipePagination(query.page, query.limit),
    ];

    return (await this.subscribeModel.aggregate(pipeline).exec()).shift();
  }

  async exportToExcel(query: ExportSubscribeDto, @Res() res: Response) {
    const now = dayjs();

    const filter: any = {
      deleted_at: { $exists: false },
    };

    if (query.source) {
      filter.source = query.source;
    }
    if (query.from_date || query.to_date) {
      filter.created_at = {};
      if (query.from_date) {
        filter.created_at.$gte = new Date(query.from_date);
      }
      if (query.to_date) {
        filter.created_at.$lte = new Date(query.to_date);
      }
    }
    const subscribes = await this.subscribeModel.find(filter);

    const columns = [
      { header: 'Họ tên', key: 'full_name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Số điện thoại', key: 'phone', width: 30 },
      { header: 'Nguồn', key: 'source', width: 30 },
      { header: 'Nội dung', key: 'content', width: 30 },
      { header: 'Ngày tạo', key: 'created_at', width: 30 },
    ];
    await this.exportExcelService.exportToResponse(res, {
      filename: 'subscribe_' + now.format('YYYYMMDD_HHmmss'),
      sheetName: 'Subscribe',
      columns: columns,
      data: subscribes,
      title: 'DANH SÁCH ĐĂNG KÝ NHẬN TIN',
    });
  }

  async updateContactedStatus(id: Types.ObjectId, isContacted: boolean) {
    return await this.subscribeModel.findByIdAndUpdate(
      id,
      { is_contacted: isContacted },
      { new: true },
    );
  }
}
