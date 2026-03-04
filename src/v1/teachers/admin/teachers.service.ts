import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { BaseService } from 'src/base/base.service';
import { uploadFile, generateRandomPin } from 'src/helper/common';
import { Course } from 'src/schemas/course.schema';
import { RegistrationStatus, Teacher } from 'src/schemas/teacher.schema';
import { User } from 'src/schemas/user.schema';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class AdminTeachersService extends BaseService {
  constructor(
    @InjectModel(Teacher.name)
    private readonly teacherModel: Model<Teacher>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectConnection() private readonly connection: Connection,
  ) {
    super({ [Teacher.name]: teacherModel });
  }

  async updateTeacher(
    id: Types.ObjectId,
    updateTeacherDto: UpdateTeacherDto,
    files: {
      cic_card_front_image?: Express.Multer.File[];
      cic_card_back_image?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
    },
  ) {
    const { password, ...teacherData } = updateTeacherDto;

    const session = await this.teacherModel.db.startSession();
    session.startTransaction();
    try {
      if (files?.cic_card_front_image?.[0]) {
        const urlImage = await uploadFile(
          files.cic_card_front_image[0],
          `${generateRandomPin()}_${Date.now()}_front_cic`,
          'cic',
        );
        Object.assign(teacherData, { cic_card_front_image: urlImage });
      }
      if (files?.cic_card_back_image?.[0]) {
        const urlImage = await uploadFile(
          files.cic_card_back_image[0],
          `${generateRandomPin()}_${Date.now()}_back_cic`,
          'cic',
        );
        Object.assign(teacherData, { cic_card_back_image: urlImage });
      }

      if (files?.avatar?.[0]) {
        const urlImage = await uploadFile(
          files.avatar[0],
          `${generateRandomPin()}_${Date.now()}_teacher`,
          'avatars',
        );
        Object.assign(teacherData, { avatar: urlImage });
      }

      const result = await this.teacherModel.findOneAndUpdate(
        { _id: id },
        {
          ...teacherData,
        },
        { new: true, session, runValidators: true },
      );

      if (password) {
        await this.userModel.updateOne(
          { _id: result.user_id },
          {
            $set: {
              password: hashSync(password, genSaltSync()),
            },
          },
          { session },
        );
      }
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      console.error('Lỗi khi cập nhật giảng viên:', error);
      throw new Error('Không thể cập nhật giảng viên');
    } finally {
      await session.endSession();
    }
  }

  async verifyTeachers(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Danh sách ID không hợp lệ hoặc rỗng.');
    }

    const objectIds = ids.map((id: string) => new Types.ObjectId(id));
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      let modifiedCount = 0;

      const teacherUpdateResult = await this.teacherModel.updateMany(
        {
          _id: { $in: objectIds },
          verify_email_at: null,
        },
        {
          $set: {
            verify_email_at: new Date(),
            status: RegistrationStatus.Approved,
          },
        },
        { session },
      );
      modifiedCount = teacherUpdateResult.modifiedCount;

      await session.commitTransaction();
      return {
        message: `Đã duyệt ${modifiedCount} giảng viên.`,
      };
    } catch (error) {
      throw new BadRequestException('Xác thực thất bại. Vui lòng thử lại.');
    } finally {
      await session.endSession();
    }
  }
}
