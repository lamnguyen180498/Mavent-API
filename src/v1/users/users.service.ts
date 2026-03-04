import { HttpException, Injectable, Logger } from '@nestjs/common';
import { User, UserDocument } from '../../schemas/user.schema';
import { Connection, Model, PipelineStage, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { BaseService } from '../../base/base.service';
import dayjs from 'dayjs';
import { City } from '../../schemas/city.schema';
import { District } from '../../schemas/district.schema';
import { Ward } from '../../schemas/ward.schema';
import { ConfigService } from '@nestjs/config';
import { EUserStatus } from 'src/enums/user.enum';
import { HttpStatusCode } from 'axios';
import { UpdateUserDto } from './dto/update-user.dto';
import { genSaltSync, hashSync } from 'bcrypt';
import { generateRandomPin, uploadFile } from 'src/helper/common';
import { RegistrationStatus } from 'src/schemas/teacher.schema';
import { FindUserDto } from './dto/find-user.dto';
import { omit } from 'lodash';
import { pipePagination } from '../../helper/pagination';

@Injectable()
export class UsersService extends BaseService {
  logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(City.name) private readonly cityModel: Model<City>,
    @InjectModel(District.name) private readonly districtModel: Model<District>,
    @InjectModel(Ward.name) private readonly wardModel: Model<Ward>,
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {
    super({ [User.name]: userModel });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).select('+password');
  }

  async findByUsername(username: string) {
    return this.userModel.findOne({ username }).select('+password');
  }

  async findByUsernameOrEmail(username_email: string) {
    return this.userModel
      .findOne({
        $or: [{ email: username_email }, { username: username_email }],
      })
      .select('+password');
  }

  async findById(id: any) {
    const result = await this.userModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: 'user_id',
          as: 'teacher',
        },
      },
      {
        $addFields: {
          teacher: {
            $filter: {
              input: '$teacher',
              as: 't',
              cond: {
                $and: [{ $ne: ['$$t.status', RegistrationStatus.Rejected] }],
              },
            },
          },
        },
      },
      {
        $addFields: {
          teacher: { $arrayElemAt: ['$teacher', 0] },
        },
      },
      { $limit: 1 },
      {
        $project: {
          password: 0,
        },
      },
    ]);

    const user = result[0];
    if (!user) return null;

    return {
      ...user,
      is_admin: new this.userModel(user).isAdministrator(),
    };
  }

  async logout(userId: Types.ObjectId) {
    return this.userModel.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: {
          important_change_at: new Date(),
        },
      },
    );
  }

  async validUser(
    id: string | Types.ObjectId,
    issued_at: number,
    expiration_time: number,
  ) {
    const conditionImportant = {
      status: {
        $nin: [EUserStatus.Blocked],
      },
      deleted_at: null,
      $or: [
        { important_change_at: null },
        {
          important_change_at: {
            // $gte: dayjs.unix(issued_at).toDate(),
            $lte: dayjs.unix(expiration_time).toDate(),
          },
        },
      ],
    };

    return this.userModel.findOne({
      _id: new Types.ObjectId(id),
      ...conditionImportant,
    });
  }

  async updateProfile(
    user: UserDocument,
    updateData: UpdateUserDto,
    files: {
      avatar?: Express.Multer.File[];
    },
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (updateData.city_id) {
        const city = await this.cityModel.findOne({
          _id: updateData.city_id,
        });
        if (!city)
          throw new HttpException(
            'Tỉnh thành không tồn tại',
            HttpStatusCode.BadRequest,
          );

        if (updateData.ward_id) {
          const ward = await this.wardModel.findOne({
            _id: updateData.ward_id,
            city_id: city._id,
          });
          if (!ward)
            throw new HttpException(
              'Phường xã không tồn tại hoặc không hợp lệ',
              HttpStatusCode.BadRequest,
            );
        } else {
          updateData.ward_id = null;
        }
      } else {
        updateData.city_id = null;
        updateData.ward_id = null;
      }

      if (updateData.password && updateData.password.trim() !== '') {
        updateData.password = hashSync(updateData.password, genSaltSync());
      }
      if (files?.avatar?.[0]) {
        const urlImage = await uploadFile(
          files.avatar[0],
          `${generateRandomPin()}_${Date.now()}_user`,
          'avatars',
        );
        Object.assign(updateData, { avatar: urlImage });
      }
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: updateData },
        { session },
      );
      await session.commitTransaction();
      return {
        statusCode: HttpStatusCode.Ok,
        message: 'Cập nhật thông tin thành công',
      };
    } catch (e) {
      this.logger.error('UpdateProfile Error', e);
      await session.abortTransaction();
      throw new HttpException('Có lỗi xảy ra, vui lòng thử lại', 500);
    } finally {
      await session.endSession();
    }
  }

  async updateAvatar(user: UserDocument, file: Express.Multer.File) {
    const urlImage = await uploadFile(file, `${user._id}`, 'avatars');
    if (!urlImage) {
      throw new HttpException(
        'Có lỗi xảy ra khi cập nhật avatar. Xin vui lòng thử lại sau',
        HttpStatusCode.InternalServerError,
      );
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      user.avatar = urlImage;
      await user.save();
      await session.commitTransaction();
      return {
        statusCode: HttpStatusCode.Ok,
        message: 'Cập nhật avatar thành công',
      };
    } catch (e) {
      this.logger.error('UpdateProfile Error', e);
      await session.abortTransaction();
      throw new HttpException('Có lỗi xảy ra, vui lòng thử lại', 500);
    } finally {
      await session.endSession();
    }
  }

  async findByCondition(query: FindUserDto, user: UserDocument) {
    const match = {
      deleted_at: null,
    };

    const realUser = new this.userModel(omit(user, 'is_admin'));
    const adminEmails = this.configService
      .get<string>('ADMIN_EMAILS')
      ?.split(',')
      .map(email => email.trim());
    if(!realUser.isAdministrator()) {
      match['email'] = { $nin: adminEmails }
    }

    if(query.keyword) {
      match['$or'] = [
        { email: { $regex: query.keyword, $options: 'i' } },
        { full_name: { $regex: query.keyword, $options: 'i' } },
      ]
    }
    const pipeline: PipelineStage[] = [
      {
        $match: match,
      },  {
        $project: {
          _id: 1,
          full_name: 1,
          email: 1,
          phone:1,
          created_at: 1,
        },
      },
      ...pipePagination(query.page, query.limit)
    ]

    const result = await this.userModel.aggregate(pipeline,{
      allowDiskUse: true,
    });
    return result.shift();
  }
}
