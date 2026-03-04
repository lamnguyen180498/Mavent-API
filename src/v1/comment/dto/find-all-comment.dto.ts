import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ECommentType } from '../../../schemas/comment.schema';
import { Transform } from 'class-transformer';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { Types } from 'mongoose';

export class FindAllCommentDto extends PageOptionsDto {
  @ApiProperty({
    description: 'loại comment',
  })
  @IsNotEmpty({ message: 'Loại comment không được để trống' })
  @IsEnum(ECommentType)
  type: string;

  @ApiProperty({
    description: 'id khóa học không được để trống',
  })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  course_id: Types.ObjectId;
}
