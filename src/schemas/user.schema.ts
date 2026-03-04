import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from './role.schema';
import { EUserStatus } from 'src/enums/user.enum';
import { Teacher, TeacherDocument, RegistrationStatus } from './teacher.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
})
export class User {
  @ApiProperty({ description: 'Họ và tên' })
  @Prop()
  full_name: string;

  @ApiProperty({ description: 'Tên đăng nhập' })
  @Prop()
  username: string;

  @ApiProperty({ description: 'Trạng thái tài khoản', enum: EUserStatus })
  @Prop({ enum: EUserStatus, default: EUserStatus.Active })
  status: EUserStatus;

  @ApiProperty({ description: 'Địa chỉ email' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'Thời gian xác thực email' })
  @Prop()
  verify_email_at: Date;

  @ApiProperty({ description: 'Thời gian gửi link xác thực email' })
  @Prop()
  email_verification_sent_at: Date;

  @ApiProperty({ description: 'Số điện thoại' })
  @Prop()
  phone: string;

  @ApiProperty({ description: 'Ảnh đại diện' })
  @Prop()
  avatar: string;

  @ApiProperty({ description: 'Mật khẩu' })
  @Prop({ required: true, select: false })
  password: string;

  @ApiProperty({ description: 'Thời gian đăng nhập cuối' })
  @Prop()
  last_login_at: Date;

  @ApiProperty({ description: 'Thành phố' })
  @Prop()
  city_id: Types.ObjectId;

  @ApiProperty({ description: 'Quận, Huyện' })
  @Prop({ type: Types.ObjectId })
  district_id: Types.ObjectId;

  @ApiProperty({ description: 'Phường, Xã' })
  @Prop({ type: Types.ObjectId })
  ward_id: Types.ObjectId;

  @ApiProperty({ description: 'Thời gian xóa tài khoản' })
  @Prop()
  deleted_at: Date;

  @ApiProperty({
    description:
      'Đánh dấu các thời điểm quan trọng liên quan đến tài khoản: đổi mật khẩu, đăng xuất...',
  })
  @Prop()
  important_change_at?: Date;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @Prop()
  address: string;

  @ApiProperty({ description: 'Danh sách vai trò của người dùng' })
  @Prop()
  roles: Types.ObjectId[];

  @ApiProperty({ description: 'Địa chỉ ip của tài khoản' })
  @Prop({ type: String })
  ip: string;

  @ApiPropertyOptional({ description: 'Giới tính' })
  @Prop({ type: Number })
  sex: number;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @Prop({ type: Date })
  birthday?: Date;

  @ApiProperty({ description: 'Thời gian gửi email quên mật khẩu' })
  @Prop()
  reset_password_sent_at?: Date;

  @ApiProperty({ description: 'Token để đặt lại mật khẩu' })
  @Prop({ type: String })
  reset_password_token?: string;

  isAdministrator: () => boolean;
  isTeacher: () => boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods = {
  getNameRoles: async function () {
    const roleOfUser: Role[] = await this.model(Role.name)
      .find({ _id: this.roles })
      .select('name');

    return roleOfUser.map((role) => role.name);
  },
  isTeacher: async function () {
    const teacher: TeacherDocument = await this.model(Teacher.name).findOne({
      user_id: this._id,
    });

    if (!teacher) return false;

    return (
      teacher.verify_email_at && teacher.status === RegistrationStatus.Approved
    );
  },
  isAdministrator: async function () {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    return adminEmails?.includes(this.email);
  },
};

UserSchema.virtual('teacher', {
  ref: Teacher.name,
  localField: '_id',
  foreignField: 'user_id',
  justOne: true,
});
