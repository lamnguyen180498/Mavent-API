import { Course } from '../../../schemas/course.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseResponseDto extends Course {
  @ApiProperty({
    description: 'Điều kiện mở khóa học. Luôn FALSE khi không sử dụng token',
  })
  can_learn: boolean;

  @ApiPropertyOptional({
    description: 'Thời gian được gắn vào khóa học. Chỉ có khi sử dụng token',
  })
  start_time?: string;
}
