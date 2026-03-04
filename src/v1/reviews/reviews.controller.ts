import { Controller, Get, Post, Body, Query, Param, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDocument } from '../../schemas/user.schema';
import { Guest } from '../../decorators/auth.decorator';
import { ParseObjectIdPipe } from '../../pipes/parse-object-id.pipe';
import { Types } from 'mongoose';

@ApiTags('Đánh giá khóa học')
@Controller({
  version: '1',
  path: 'reviews',
})
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo đánh giá khóa học' })
  async create(
    @Body() dto: CreateReviewDto,
    @Req() req: { user: UserDocument },
  ) {
    return this.reviewsService.createReview(req.user, dto);
  }

  @Get()
  @Guest()
  @ApiOperation({ summary: 'Danh sách đánh giá' })
  async findAll(@Query() query: FindReviewsDto) {
    return this.reviewsService.findReviews(query);
  }

  @Get('course/:courseId/summary')
  @Guest()
  @ApiOperation({ summary: 'Tổng quan đánh giá khóa học' })
  async getCourseSummary(
    @Param('courseId', ParseObjectIdPipe) courseId: Types.ObjectId,
  ) {
    return this.reviewsService.getCourseRatingSummary(courseId);
  }
}
