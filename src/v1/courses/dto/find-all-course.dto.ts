import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { CourseStatusEnum } from '../../../schemas/course.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { LessonMaterialType } from 'src/schemas/lesson.schema';
import { BooleanTransform } from 'src/common/transforms/boolean.transform';
import { Prop } from '@nestjs/mongoose';
export const SortByCourseEnum = {
  Lastest: 'lastest',
  LowToHigh: 'low-to-high',
  HighToLow: 'high-to-low',
  RatingHighToLow: 'rating-high-to-low',
  RatingLowToHigh: 'rating-low-to-high',
  Top: 'top',
};
export class FindAllCourseDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Id danh mục',
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  category_id?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên khóa học',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái khóa học',
  })
  @IsOptional()
  @IsEnum(CourseStatusEnum)
  @Type(() => Number)
  status?: CourseStatusEnum;

  @ApiPropertyOptional({
    description: 'loại khóa học',
  })
  @IsOptional()
  @IsEnum(LessonMaterialType)
  type?: string;

  @ApiPropertyOptional({
    description: 'Id giảng viên',
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  owner_id?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Phân trang',
  })
  @IsOptional()
  @Transform(BooleanTransform)
  all?: boolean;

  @ApiPropertyOptional({
    description: 'Xem danh sách mà ko giới hạn quyền sở hữu',
  })
  @IsOptional()
  @Transform(BooleanTransform)
  is_admin?: boolean;

  @ApiPropertyOptional({
    description: 'Miễn phí',
  })
  @IsOptional()
  @Transform(BooleanTransform)
  is_free?: boolean;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo',
  })
  @IsOptional()
  @Prop({ type: SortByCourseEnum })
  sort_by_course?: (typeof SortByCourseEnum)[keyof typeof SortByCourseEnum];
}
