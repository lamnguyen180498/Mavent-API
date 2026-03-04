import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseService } from '../../base/base.service';
import { Review } from '../../schemas/review.schema';
import { Course } from '../../schemas/course.schema';
import { UserCourse } from '../../schemas/user-course.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { UserDocument } from '../../schemas/user.schema';
import { PageDto } from '../../base/dto/page.dto';
import { PageMetaDto } from '../../base/dto/page-meta.dto';

@Injectable()
export class ReviewsService extends BaseService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
  ) {
    super({
      [Review.name]: reviewModel,
      [Course.name]: courseModel,
      [UserCourse.name]: userCourseModel,
    });
  }

  async createReview(user: UserDocument, dto: CreateReviewDto) {
    // Check if user has purchased the course
    const userCourse = await this.userCourseModel.findOne({
      user_id: user._id,
      course_id: dto.course_id,
      paid: true,
    });

    if (!userCourse) {
      throw new BadRequestException('Bạn cần mua khóa học trước khi đánh giá');
    }

    // Check if user already reviewed
    const existingReview = await this.reviewModel.findOne({
      user_id: user._id,
      course_id: dto.course_id,
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá khóa học này rồi');
    }

    // Create the review
    const review = await this.reviewModel.create({
      user_id: user._id,
      course_id: dto.course_id,
      rating: dto.rating,
      content: dto.content,
      status: 1,
    });

    // Update course rating stats
    await this.updateCourseRatingStats(dto.course_id);

    return review;
  }

  async findReviews(query: FindReviewsDto) {
    const filter: any = { status: 1 };

    if (query.course_id) {
      filter.course_id = query.course_id;
    }

    const reviews = await this.reviewModel
      .find(filter)
      .sort({ created_at: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .populate({
        path: 'user',
        select: 'full_name avatar',
      })
      .lean({ virtuals: true });

    const itemCount = await this.reviewModel.countDocuments(filter);

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: {
        page: query.page,
        limit: query.limit,
        skip: query.skip,
      },
    });

    return new PageDto(reviews, pageMetaDto);
  }

  async getCourseRatingSummary(courseId: Types.ObjectId) {
    const result = await this.reviewModel.aggregate([
      { $match: { course_id: courseId, status: 1 } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          distribution: {
            $push: '$rating',
          },
        },
      },
      {
        $project: {
          _id: 0,
          average: { $round: ['$average', 1] },
          count: 1,
          stars_1: {
            $size: {
              $filter: { input: '$distribution', cond: { $eq: ['$$this', 1] } },
            },
          },
          stars_2: {
            $size: {
              $filter: { input: '$distribution', cond: { $eq: ['$$this', 2] } },
            },
          },
          stars_3: {
            $size: {
              $filter: { input: '$distribution', cond: { $eq: ['$$this', 3] } },
            },
          },
          stars_4: {
            $size: {
              $filter: { input: '$distribution', cond: { $eq: ['$$this', 4] } },
            },
          },
          stars_5: {
            $size: {
              $filter: { input: '$distribution', cond: { $eq: ['$$this', 5] } },
            },
          },
        },
      },
    ]);

    return (
      result[0] || {
        average: 0,
        count: 0,
        stars_1: 0,
        stars_2: 0,
        stars_3: 0,
        stars_4: 0,
        stars_5: 0,
      }
    );
  }

  private async updateCourseRatingStats(courseId: Types.ObjectId) {
    const stats = await this.reviewModel.aggregate([
      { $match: { course_id: courseId, status: 1 } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const { average = 0, count = 0 } = stats[0] || {};

    await this.courseModel.findByIdAndUpdate(courseId, {
      rating_average: Math.round(average * 10) / 10,
      rating_count: count,
    });
  }
}
