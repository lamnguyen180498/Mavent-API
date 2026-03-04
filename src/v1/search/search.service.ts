import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from 'src/base/base.service';
import { Course, CourseStatusEnum } from 'src/schemas/course.schema';
import { Teacher } from 'src/schemas/teacher.schema';

@Injectable()
export class SearchService extends BaseService {
  constructor(
    @InjectModel(Teacher.name)
    private readonly teacherModel: Model<Teacher>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
  ) {
    super({});
  }

  async search(q: string) {
    if (!q || !q.trim()) return { teachers: [], courses: [] };

    const [teachers, courses] = await Promise.all([
      this.teacherModel
        .find(
          { $text: { $search: q } },
          { full_name: 1, email: 1, avatar: 1, score: { $meta: 'textScore' } },
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(10)
        .exec(),

      this.courseModel
        .find(
          {
            deleted_at: null,
            $and: [
              { $text: { $search: q } },
              {
                status: {
                  $in: [
                    CourseStatusEnum.OpenForSale,
                    CourseStatusEnum.WillOpen,
                  ],
                },
              },
            ],
          },
          {
            title: 1,
            introduce: 1,
            slug: 1,
            publish_at: 1,
            owner_id: 1,
            score: { $meta: 'textScore' },
          },
        )
        .populate('owner', 'full_name')
        .sort({ score: { $meta: 'textScore' } })
        .limit(15)
        .exec(),
    ]);

    return { teachers, courses };
  }
}
