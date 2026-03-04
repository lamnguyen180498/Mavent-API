import { Transform, Type } from 'class-transformer';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { Types } from 'mongoose';

export class FindReviewsDto {
    @ApiPropertyOptional({ type: String, description: 'ID khóa học' })
    @IsOptional()
    @Transform(ObjectIdTransform)
    course_id?: Types.ObjectId;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    get skip(): number {
        return (this.page - 1) * this.limit;
    }
}
