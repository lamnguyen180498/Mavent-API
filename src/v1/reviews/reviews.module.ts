import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review, ReviewSchema } from '../../schemas/review.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { UserCourse, UserCourseSchema } from '../../schemas/user-course.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Review.name, schema: ReviewSchema },
            { name: User.name, schema: UserSchema },
            { name: Course.name, schema: CourseSchema },
            { name: UserCourse.name, schema: UserCourseSchema },
        ]),
    ],
    controllers: [ReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule { }
