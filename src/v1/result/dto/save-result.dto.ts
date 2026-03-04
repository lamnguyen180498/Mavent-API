import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { BooleanTransform } from '../../../common/transforms/boolean.transform';

export class AnswerKeyValueDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class AnswerDragDropDto {
  @IsString()
  drag: string;

  @IsString()
  drop: number;
}

export class AnswerMixDto {
  @IsString()
  code: string;

  @IsString()
  value: string[];

  @ApiHideProperty()
  is_correct?: boolean;

  @ApiHideProperty()
  is_skip?: boolean;

  @ApiHideProperty()
  score?: number;
}

export class AnswerQuizDto {
  @ApiProperty({
    description: 'id câu hỏi',
    type: Types.ObjectId,
    example: '60c72b2f9b1e8d001c8e4f3a',
  })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  id: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'câu trả lời: string, string[], hoặc object[]',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
          required: ['key', 'value'],
        },
      },
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            value: { type: 'array', items: { type: 'string' } },
          },
          required: ['code', 'value'],
        },
      },
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            drag: { type: 'string' },
            drop: { type: 'string' },
          },
          required: ['drop'],
        },
      },
    ],
  })
  @IsOptional()
  answer:
    | string
    | string[]
    | AnswerKeyValueDto[]
    | AnswerDragDropDto[]
    | AnswerMixDto[];

  @ApiHideProperty()
  is_correct?: boolean;

  @ApiHideProperty()
  is_skip?: boolean;

  @ApiHideProperty()
  score?: number;

  @ApiHideProperty()
  teacher_note?: string;

  @ApiHideProperty()
  score_max?: number;
}

export class SaveResultDto {
  @ApiPropertyOptional({
    description: 'câu trả lời của bài kiểm tra theo từng id câu hỏi',
    type: AnswerQuizDto,
  })
  @IsOptional()
  @Type(() => AnswerQuizDto)
  @ValidateNested({ each: true })
  data_quiz: AnswerQuizDto[];

  @ApiProperty({
    description: 'Thời gian làm bài (tính bằng giây)',
    type: Number,
  })
  @IsNotEmpty({ message: 'Vui lòng nhập thời gian làm bài' })
  @Type(() => Number)
  @Min(1, { message: 'Thời gian làm bài không hợp lệ' })
  complete_time: number;

  @ApiPropertyOptional({
    description: 'id khóa học',
    type: Types.ObjectId,
    example: '60c72b2f9b1e8d001c8e4f3a',
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  course_id?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'id bài học',
    type: Types.ObjectId,
    example: '60c72b2f9b1e8d001c8e4f3a',
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  lesson_id?: Types.ObjectId;
}

export class MarkQuizEssayDto {
  @ApiProperty({
    description: 'id câu hỏi',
    type: Types.ObjectId,
    example: '60c72b2f9b1e8d001c8e4f3a',
  })
  @IsNotEmpty()
  @IsMongoId()
  id: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Chấm đúng sai true | false',
  })
  @IsOptional()
  @Transform(BooleanTransform)
  is_correct?: boolean;

  @ApiPropertyOptional({
    description: 'Điểm số câu tự luận (ko áp dụng cho đề thi thường)',
    type: Number,
  })
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({
    description: 'Nhận xét giảng viên',
    type: String,
  })
  @IsOptional()
  teacher_note?: string;
}

export class MarkEssayResultDto {
  @ApiProperty({
    description: 'chấm theo từng id câu hỏi',
    type: AnswerQuizDto,
  })
  @IsNotEmpty()
  @Type(() => MarkQuizEssayDto)
  @ValidateNested({ each: true })
  data_quiz: MarkQuizEssayDto[];
}
