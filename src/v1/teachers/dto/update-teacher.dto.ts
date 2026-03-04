import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTeacherDto } from './create-teacher.dto';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';
import { Types } from 'mongoose';
import { TemplateEnum } from '../../../schemas/teacher.schema';

export class ExperienceItemDto {
  @ApiProperty({ description: 'Tiêu đề kinh nghiệm' })
  @IsNotEmpty({ message: 'Tiêu đề kinh nghiệm là bắt buộc' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Tên công ty / tổ chức' })
  @IsNotEmpty({ message: 'Tên công ty là bắt buộc' })
  @IsString()
  company: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Vị trí đảm nhiệm' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Tiêu đề hồ sơ' })
  @IsOptional()
  @IsString()
  profile_title?: string;
}

export class SkillItemDto {
  @ApiProperty({ description: 'Tên kỹ năng' })
  @IsNotEmpty({ message: 'Kỹ năng không được để trống' })
  @IsString()
  name: string;
}

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {
  @ApiProperty({ description: 'Số điện thoại' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @ApiPropertyOptional({ description: 'Thành phố' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  city_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Phường, xã' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  ward_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @Transform(({ value }) => String(value))
  address?: string;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  birthday?: Date;

  @ApiPropertyOptional({ description: 'Giới tính (1: Nam, 2: Nữ)' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  sex?: number;

  @IsOptional()
  avatar?: string;

  @IsOptional()
  cic_card_back_image?: string;

  @IsOptional()
  cic_card_front_image?: string;

  @ApiPropertyOptional({ description: 'slogan' })
  @IsOptional()
  @IsString()
  slogan?: string;

  @ApiPropertyOptional({ description: 'Giới thiệu' })
  @IsOptional()
  @IsString()
  introduce?: string;

  @ApiPropertyOptional({ description: 'Học vấn' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Video giới thiệu vấn' })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiPropertyOptional({ description: 'Mật khẩu mới' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @ApiPropertyOptional({ description: 'Template', enum: TemplateEnum })
  @IsOptional()
  @IsEnum(TemplateEnum)
  template?: TemplateEnum;

  @ApiPropertyOptional({
    description: 'Danh sách kinh nghiệm',
    type: [ExperienceItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItemDto)
  experiences?: ExperienceItemDto[];

  @ApiPropertyOptional({
    description: 'Danh sách kỹ năng',
    type: [SkillItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillItemDto)
  skills?: SkillItemDto[];
}
