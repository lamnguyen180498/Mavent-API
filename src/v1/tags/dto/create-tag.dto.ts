import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
    @ApiProperty({ description: 'Tiêu đề tag', example: 'Javascript' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
