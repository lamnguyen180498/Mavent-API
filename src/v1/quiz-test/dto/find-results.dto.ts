import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { Types } from 'mongoose';

export class FindResultsDto extends PageOptionsDto {
    @ApiPropertyOptional({ type: String, description: 'Từ khóa (Họ tên)' })
    @IsOptional()
    @IsString()
    keyword?: string;
}
