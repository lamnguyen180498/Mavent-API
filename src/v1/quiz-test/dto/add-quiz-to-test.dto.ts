import { Types } from 'mongoose';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import {
  ListRandomQuiz,
  QuizTestOptionSelectQuizEnum,
} from 'src/schemas/quiz-test.schema';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ObjectIdArrayTransform } from '../../../common/transforms/object-id-array.transform';
import { Transform, Type } from 'class-transformer';
export class AddQuizToTestDto {
  @ApiPropertyOptional({
    type: Number,
    enum: QuizTestOptionSelectQuizEnum,
    description: 'Kiểu lấy câu hỏi vào đề thi',
  })
  @IsOptional()
  @IsEnum(QuizTestOptionSelectQuizEnum, {
    message: 'Kiểu lấy câu hỏi không hợp lệ',
  })
  option_select_quiz: QuizTestOptionSelectQuizEnum;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Số lượng câu hỏi ngẫu nhiên (option_select_quiz = )' +
      QuizTestOptionSelectQuizEnum.Random +
      ')',
  })
  @ValidateIf(
    (obj) => obj.option_select_quiz === QuizTestOptionSelectQuizEnum.Random,
  )
  @IsOptional()
  @IsNumber({}, { message: 'Số lượng câu hỏi ngẫu nhiên phải là số' })
  @Min(1, { message: 'Số lượng câu hỏi ngẫu nhiên phải lớn hơn 0' })
  @Max(1000, {
    message: 'Số lượng câu hỏi ngẫu nhiên không được vượt quá 1000',
  })
  number_quiz_random?: number;

  @ApiPropertyOptional({
    type: [String],
    description:
      'ID tag random (option_select_quiz = )' +
      QuizTestOptionSelectQuizEnum.Random +
      ')',
  })
  @ValidateIf(
    (obj) => obj.option_select_quiz === QuizTestOptionSelectQuizEnum.Random,
  )
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  @IsArray({ message: 'Danh sách tag phải là mảng' })
  @ArrayMinSize(1, { message: 'Bạn cần chọn ít nhất một tag' })
  tag_random_ids?: [Types.ObjectId] | [];

  @ApiPropertyOptional({
    type: [String],
    description:
      'Danh sách ID câu hỏi (option_select_quiz = )' +
      QuizTestOptionSelectQuizEnum.Select +
      ')',
  })
  @ValidateIf(
    (obj) => obj.option_select_quiz === QuizTestOptionSelectQuizEnum.Select,
  )
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  @IsArray({ message: 'Danh sách câu hỏi phải là mảng' })
  @ArrayMinSize(1, { message: 'Bạn cần chọn ít nhất một câu hỏi' })
  quiz_ids?: Types.ObjectId[] | [];

  @ApiPropertyOptional({
    type: [ListRandomQuiz],
    description:
      'Danh sách lấy ngẫu nhiên trong danh sách chọn (option_select_quiz = )' +
      QuizTestOptionSelectQuizEnum.RandomList +
      ')',
  })
  @ValidateIf(
    (obj) => obj.option_select_quiz === QuizTestOptionSelectQuizEnum.RandomList,
  )
  @IsOptional()
  @IsArray({ message: 'Danh sách câu hỏi phải là mảng' })
  @ArrayMinSize(1, { message: 'Danh sách list_random không được để trống' })
  @ValidateNested({ each: true })
  @Type(() => ListRandomQuiz)
  list_random?: ListRandomQuiz[];
}
