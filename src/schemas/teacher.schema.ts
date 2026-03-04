import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';
import { City, CityDocument } from './city.schema';

export type TeacherDocument = HydratedDocument<Teacher>;
export enum RegistrationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum TemplateEnum {
  Default = 'default',
  Template1 = 'template_1',
  Template2 = 'template_2',
  Template3 = 'template_3',
}

export class Skill {
  @ApiProperty({ description: 'Tên kỹ năng' })
  @Prop({ type: String, required: true })
  name: string;
}
export class Experience {
  @ApiProperty({ description: 'Tiêu đề kinh nghiệm' })
  @Prop({ type: String, required: true })
  title: string;

  @ApiProperty({ description: 'Tên công ty / tổ chức' })
  @Prop({ type: String, required: true })
  company: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu' })
  @Prop({ type: String })
  start_date?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc' })
  @Prop({ type: String })
  end_date?: string;

  @ApiPropertyOptional({ description: 'Vị trí' })
  @Prop({ type: String })
  position?: string;

  @ApiPropertyOptional({ description: 'Tiêu đề hồ sơ' })
  @Prop({ type: String })
  profile_title?: string;
}
@Schema({
  collection: 'teachers',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
})
export class Teacher {
  @ApiProperty({
    type: String,
    description: 'Id người dùng',
  })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value)
      ? Types.ObjectId.createFromHexString(value)
      : undefined,
  )
  user_id: Types.ObjectId;

  @ApiProperty({ type: String, description: 'Số điện thoại' })
  @IsNotEmpty()
  @Prop({ type: String })
  phone: string;

  @ApiProperty({ type: String, description: 'Mã số thuế' })
  @IsNotEmpty()
  @Prop({ type: String })
  tax_code: string;

  @ApiProperty({ type: String, description: 'CCCD' })
  @IsNotEmpty()
  @Prop({ type: String })
  cic: string;

  @ApiProperty({ type: String, description: 'Địa chỉ' })
  @IsNotEmpty()
  @Prop({ type: String })
  address: string;

  @ApiProperty({ type: Date, description: 'Ngày cấp' })
  @IsNotEmpty()
  @Prop({ type: Date })
  issue_date: Date;

  @ApiProperty({ type: String, description: 'Nơi cấp' })
  @IsNotEmpty()
  @Prop({ type: String })
  identification_place: string;

  @ApiProperty({ description: 'Ảnh căn cước mặt trước' })
  @IsOptional()
  @Prop({
    type: String,
    required: false,
  })
  cic_card_front_image: string;

  @ApiProperty({ description: 'Ảnh căn cước mặt trước' })
  @IsOptional()
  @Prop({
    type: String,
  })
  cic_card_back_image: string;

  @ApiPropertyOptional({ description: 'Tài khoản ngân hàng' })
  @IsOptional()
  @Prop({
    type: String,
  })
  bank_account_number?: string;

  @ApiPropertyOptional({ description: 'Tên ngân hàng' })
  @IsOptional()
  @Prop({
    type: String,
  })
  bank_name?: string;

  @ApiProperty({
    type: Number,
    description: 'Trạng thái',
    default: RegistrationStatus.Pending,
  })
  @IsEnum(RegistrationStatus)
  @IsOptional()
  @Prop({ type: Number, default: 0 })
  status?: (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

  @ApiPropertyOptional({ description: 'Giới tính' })
  @Prop({ type: Number })
  sex?: number;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @Prop({ type: Date })
  birthday?: Date;

  @ApiPropertyOptional({ description: 'Thành phố' })
  @IsOptional()
  @Prop({ type: Types.ObjectId, ref: 'City' })
  @Transform(ObjectIdTransform)
  city_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Phường, xã' })
  @IsOptional()
  @Prop({ type: Types.ObjectId })
  @Transform(ObjectIdTransform)
  ward_id?: Types.ObjectId;

  @ApiProperty({ description: 'Địa chỉ email' })
  @Prop({ unique: true })
  email?: string;

  @ApiProperty({ description: 'Thời gian xác thực email' })
  @Prop()
  verify_email_at?: Date;

  @ApiProperty({ description: 'Ảnh đại diện' })
  @Prop()
  avatar?: string;

  @ApiProperty({ description: 'Họ và tên' })
  @Prop()
  full_name?: string;

  city: CityDocument;

  @ApiProperty({ description: 'Slogan' })
  @IsOptional()
  @Prop()
  slogan?: string;

  @ApiProperty({ description: 'Giới thiệu' })
  @IsOptional()
  @Prop()
  introduce?: string;

  @ApiProperty({ description: 'Video giới thiệu' })
  @IsOptional()
  @Prop()
  video?: string;

  @ApiProperty({ description: 'Video giới thiệu' })
  @IsOptional()
  @Prop()
  education?: string;

  @ApiProperty({ description: 'Template' })
  @IsOptional()
  @IsEnum(TemplateEnum)
  @Prop({ type: String, default: 'default' })
  template?: (typeof TemplateEnum)[keyof typeof TemplateEnum];

  @ApiPropertyOptional({
    description: 'Danh sách kinh nghiệm',
    type: [Experience],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Prop({ type: [Experience], default: [] })
  experiences?: Experience[];

  @ApiPropertyOptional({
    description: 'Danh sách kỹ năng',
    type: [Skill],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Prop({ type: [Skill], default: [] })
  skills?: Skill[];
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);

TeacherSchema.index({ full_name: 'text' });

TeacherSchema.virtual('city', {
  ref: City.name,
  localField: 'city_id',
  foreignField: '_id',
  justOne: true,
});
