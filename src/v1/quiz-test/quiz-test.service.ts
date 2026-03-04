import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { Model, ProjectionType, RootFilterQuery, Types } from 'mongoose';
import {
  QuizTest,
  QuizTestOptionSelectQuizEnum,
} from 'src/schemas/quiz-test.schema';
import { Quiz } from '../../schemas/quiz.schema';
import { QuizResult } from '../../schemas/quiz-result.schema';
import { InjectModel } from '@nestjs/mongoose';
import {
  FindQuizTestDto,
  SelectListQuizTestDto,
} from './dto/find-quiz-test.dto';
import { PageMetaDto } from '../../base/dto/page-meta.dto';
import { PageDto } from '../../base/dto/page.dto';
import { omit } from 'lodash';
import { User, UserDocument } from '../../schemas/user.schema';
import { GetTestLearnDto } from './dto/get-test-learn.dto';

@Injectable()
export class QuizTestService extends BaseService {
  constructor(
    @InjectModel(QuizTest.name) private readonly quizTestModel: Model<QuizTest>,
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(QuizResult.name)
    private readonly quizResultModel: Model<QuizResult>,
  ) {
    super({
      [QuizTest.name]: quizTestModel,
    });
  }
  async findAllByCondition(query: FindQuizTestDto) {
    const { filters, selects, sort } = query;
    let filterQuery: RootFilterQuery<QuizTest> = {
      deleted_at: null,
    };
    const projection: ProjectionType<QuizTest> = {};
    if (selects && selects.length > 0) {
      selects.forEach((field) => {
        projection[field] = 1;
      });
    }
    if (filters?.keyword) {
      filterQuery['$or'] = [
        { title: RegExp(filters.keyword, 'i') },
        { description: RegExp(filters.keyword, 'i') },
      ];
    }
    if (filters?.tag_ids) {
      filterQuery['tag_ids'] =
        filters.tag_ids.length === 1
          ? filters.tag_ids[0]
          : { $in: filters.tag_ids };
    }
    if (filters?.status !== undefined) {
      filterQuery['status'] = filters.status;
    }

    if (filters && filters.creator_id) {
      filterQuery['creator_id'] = filters.creator_id;
    }
    const q = this.quizTestModel
      .find(filterQuery, projection, { sort: sort || { _id: -1 } })
      .populate({
        path: 'tags',
        select: 'name',
      })
      .skip(query.skip)
      .limit(query.limit);
    const data = await q;
    const itemCount = await this.quizTestModel.countDocuments(filterQuery);
    return new PageDto<QuizTest>(
      data,
      new PageMetaDto({
        pageOptionsDto: query,
        itemCount,
      }),
    );
  }

  async selectList(query: SelectListQuizTestDto, user: UserDocument) {
    const filters = {
      deleted_at: null,
    };
    const realUser = new this.userModel(omit(user, 'is_admin'));
    if (!realUser.isAdministrator()) {
      filters['creator_id'] = realUser._id;
    }
    if (query.keyword) {
      filters['title'] = { $regex: query.keyword.trim(), $options: 'i' };
    }
    if (query.ids?.length) {
      filters['_id'] =
        query.ids.length === 1
          ? query.ids[0]
          : {
              $in: query.ids,
            };
    }

    const projects = [];
    if (query.selects && query.selects.length > 0) {
      query.selects.forEach((field) => {
        projects.push(field);
      });
    }
    return this.quizTestModel
      .find(filters, projects.length > 0 ? projects : ['title'])
      .sort({ _id: -1 })
      .skip(query.skip)
      .limit(query.limit);
  }

  async getQuizLearn(_id: Types.ObjectId, query: GetTestLearnDto) {
    const quizTest = await this.quizTestModel.findOne({
      _id,
      deleted_at: null,
    });
    if (!quizTest) {
      throw new HttpException(
        'Không tìm thấy bài kiểm tra',
        HttpStatus.NOT_FOUND,
      );
    }
    let quizData = [];

    switch (quizTest.option_select_quiz) {
      case QuizTestOptionSelectQuizEnum.Random:
        if (
          quizTest.tag_random_ids &&
          quizTest.tag_random_ids.length > 0 &&
          quizTest.number_quiz_random > 0
        ) {
          quizData = await this.quizModel.aggregate([
            {
              $match: {
                deleted_at: null,
                tag_ids: { $in: quizTest.tag_random_ids },
              },
            },
            { $project: { corrects: 0, 'items.corrects': 0 } },
            { $sample: { size: quizTest.number_quiz_random } },
          ]);
          if (quizData.length < quizTest.number_quiz_random) {
            throw new HttpException(
              'Không đủ câu hỏi để làm bài kiểm tra',
              HttpStatus.NOT_FOUND,
            );
          }
        }
        break;
      case QuizTestOptionSelectQuizEnum.Select:
        if (quizTest.quiz_ids && quizTest.quiz_ids.length > 0) {
          const allQuiz = await this.quizModel.find(
            {
              _id: { $in: quizTest.quiz_ids },
              deleted_at: null,
            },
            { corrects: 0, 'items.corrects': 0 },
          );
          if (allQuiz.length < quizTest.quiz_ids.length) {
            throw new HttpException(
              'Một số câu hỏi không tồn tại',
              HttpStatus.NOT_FOUND,
            );
          }
          if (!quizTest.random_question) {
            quizData = quizTest.quiz_ids.map((id) =>
              allQuiz.find((q) => q._id.equals(id)),
            );
          } else {
            quizData = allQuiz;
          }
        }
        break;
      case QuizTestOptionSelectQuizEnum.RandomList:
        if (quizTest.list_random && quizTest.list_random.length > 0) {
          for (const item of quizTest.list_random) {
            if (item.tags && item.number && item.number > 0) {
              const tagIds = item.tags.map((id) => new Types.ObjectId(id));
              const quizRandom = await this.quizModel.aggregate([
                {
                  $match: {
                    deleted_at: null,
                    tag_ids: tagIds.length > 1 ? { $in: tagIds } : tagIds[0],
                    ...(quizData.length > 0
                      ? { _id: { $nin: quizData.map((q) => q._id) } }
                      : {}),
                  },
                },
                { $project: { corrects: 0, 'items.corrects': 0 } },
                { $sample: { size: item.number } },
              ]);
              if (quizRandom.length > 0) {
                quizData = quizData.concat(quizRandom);
              }
            }
          }
        }
        break;
    }

    if (quizData.length === 0) {
      throw new HttpException(
        'Không có câu hỏi nào trong bài kiểm tra',
        HttpStatus.NOT_FOUND,
      );
    }
    return quizData;
  }
}
