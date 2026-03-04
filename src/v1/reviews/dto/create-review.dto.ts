import { Transform, Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { Types } from 'mongoose';

export class CreateReviewDto {
    @ApiProperty({ type: String, description: 'ID khóa học' })
    @IsNotEmpty({ message: 'ID khóa học là bắt buộc' })
    @Transform(ObjectIdTransform)
    course_id: Types.ObjectId;

    @ApiProperty({ description: 'Số sao đánh giá (1-5)', minimum: 1, maximum: 5 })
    @IsNumber()
    @Min(1, { message: 'Số sao tối thiểu là 1' })
    @Max(5, { message: 'Số sao tối đa là 5' })
    @Type(() => Number)
    rating: number;

    @ApiPropertyOptional({ description: 'Nội dung đánh giá' })
    @IsOptional()
    @IsString()
    content?: string;
}
