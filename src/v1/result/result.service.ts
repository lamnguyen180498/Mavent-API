import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnswerQuizDto,
  SaveResultDto,
} from './dto/save-result.dto';
import {
  Connection,
  Model,
  Types,
} from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { omit } from 'lodash';
import { BaseService } from '../../base/base.service';
import {
  EQuizResultStatus,
  QuizResult,
} from '../../schemas/quiz-result.schema';
import { QuizTest, QuizTestDocument } from '../../schemas/quiz-test.schema';
import { EQuizType, Quiz } from '../../schemas/quiz.schema';
import { UserDocument } from '../../schemas/user.schema';
import { FindLastResultDto } from './dto/find-last-result.dto';
import { FindByConditionDto } from './dto/find-by-condition.dto';

@Injectable()
export class ResultService extends BaseService {
  constructor(
    @InjectModel(QuizResult.name)
    private readonly resultModel: Model<QuizResult>,
    @InjectModel(QuizTest.name) private readonly quizTestModel: Model<QuizTest>,
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @InjectConnection() private readonly connection: Connection,
  ) {
    super({
      [QuizResult.name]: resultModel,
      [QuizTest.name]: quizTestModel,
    });
  }

  async saveResult(
    quizTest: QuizTestDocument,
    body: SaveResultDto,
    user: UserDocument,
  ) {
    const quizIds = body.data_quiz.map((quiz) => quiz.id);
    const quizzes = await this.quizModel.find(
      {
        _id: { $in: quizIds },
        deleted_at: null,
      },
      {
        corrects: 1,
        type: 1,
        'items.corrects': 1,
        'items.code': 1,
        'answers.id': 1,
      },
    );
    if (quizzes.length !== quizIds.length) {
      throw new HttpException(
        'Một hoặc nhiều câu hỏi không tồn tại',
        HttpStatus.NOT_FOUND,
      );
    }
    const scoreOne: number = quizTest.point || 1;
    let total_quiz_phrase_statement = 0;
    const stats = {
      score: 0,
      correct: 0,
      fail: 0,
      skip: 0,
      total_quiz: 0,
    };
    const quizAnswers = body.data_quiz.map((quizAnswer: AnswerQuizDto) => {
      const quizData = quizzes.find(
        (q) => q._id.toString() === quizAnswer.id.toString(),
      );
      if (!quizData) {
        throw new HttpException(
          `Câu hỏi với ID ${quizAnswer.id} không tồn tại`,
          HttpStatus.NOT_FOUND,
        );
      }
      switch (quizData.type) {
        case EQuizType.TrueFalse:
        case EQuizType.OneChoice:
        case EQuizType.MultipleChoice:
        case EQuizType.Matching:
          quizAnswer.answer = quizAnswer.answer || [];
          if (typeof quizAnswer.answer === 'string') {
            quizAnswer.answer = [quizAnswer.answer];
          }
          if (
            !Array.isArray(quizAnswer.answer) ||
            !quizAnswer.answer.every((item) => typeof item === 'string')
          ) {
            throw new HttpException(
              `Câu trả lời cho câu hỏi ${quizAnswer.id} không hợp lệ`,
              HttpStatus.BAD_REQUEST,
            );
          }
          const answerStrings = quizAnswer.answer as string[];

          if (answerStrings.length > 0) {
            // Xoá trùng
            quizAnswer.answer = Array.from(new Set(answerStrings));

            const corrects = Array.from(
              new Set((quizData.corrects as string[]) || []),
            );
            quizAnswer.is_correct =
              answerStrings.length === corrects.length &&
              answerStrings.every((a) => corrects.includes(a));
            quizAnswer.score = quizAnswer.is_correct ? scoreOne : 0;
          } else {
            quizAnswer.is_skip = true;
          }
          break;
        default:
          throw new HttpException(
            `Loại câu hỏi ${quizData.type} không được hỗ trợ`,
            HttpStatus.BAD_REQUEST,
          );
      }
      stats.score += quizAnswer.score || 0;
      if (quizAnswer.is_correct === true) {
        stats.correct += 1;
      } else {
        stats.fail += 1;
      }
      stats.skip += quizAnswer.is_skip ? 1 : 0;
      stats.total_quiz += 1;
      return quizAnswer;
    });
    const createData: QuizResult = {
      ...stats,
      test_id: quizTest._id,
      total_quiz_phrase_statement,
      lesson_id: body.lesson_id || undefined,
      course_id: body.course_id || undefined,
      user_id: user._id,
      user_full_name: user.full_name || '',
      total_score: stats.total_quiz * scoreOne,
      percent_complete: quizTest.percent_complete,
      quiz_point: scoreOne,
      quiz_answer: JSON.stringify(quizAnswers),
      complete_time: body.complete_time,
    };
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.resultModel.updateMany(
        {
          user_id: user._id,
          test_id: quizTest._id,
          lesson_id: body.lesson_id || '',
          hide_result: null,
          status: { $ne: EQuizResultStatus.Deleted },
        },
        {
          $set: {
            hide_result: true,
          },
        },
        { session },
      );
      const data = await this.resultModel.create([createData], { session });
      await session.commitTransaction();

      return omit(data[0].toObject(), 'quiz_answer');
    } catch (e) {
      console.log('ex:', e);
      await session.abortTransaction();
      throw new HttpException(
        'Có lỗi xảy ra, vui lòng thử lại',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }
  async getLatestResult(
    quizId: Types.ObjectId,
    user: UserDocument,
    query: FindLastResultDto,
  ) {
    const filter: any = {
      test_id: quizId,
      user_id: user._id,
      hide_result: null,
      status: { $ne: EQuizResultStatus.Deleted },
    };

    if (query.course_id) {
      filter.course_id = query.course_id;
    }

    if (query.lesson_id) {
      filter.lesson_id = query.lesson_id;
    }

    return this.resultModel
      .findOne(filter)
      .sort({ createdAt: -1 });
  }

  async getByCondition(quizId: Types.ObjectId, user: UserDocument, query: FindByConditionDto) {
    const filter: any = {
      test_id: quizId,
      user_id: user._id,
      hide_result: null,
      status: { $ne: EQuizResultStatus.Deleted },
    };

    if (query.course_id) {
      filter.course_id = query.course_id;
    }

    if (query.lesson_id) {
      filter.lesson_id = query.lesson_id;
    }

    return this.resultModel
      .find(filter)
      .sort({ createdAt: -1 });
  }

  async getListQuestionByResult(resultId: Types.ObjectId, user: UserDocument) {
    const result = await this.resultModel.findOne({
      _id: resultId,
      status: { $ne: EQuizResultStatus.Deleted },
    });

    if (!result) {
      throw new NotFoundException('Kết quả làm bài không tồn tại');
    }

    if (result.user_id.toString() !== user._id.toString()) {
      const quizTest = await this.quizTestModel.findOne({
        _id: result.test_id,
        creator_id: user._id,
        deleted_at: null,
      });

      if (!quizTest) {
        throw new NotFoundException('Kết quả làm bài không tồn tại hoặc bạn không có quyền xem');
      }
    }

    const quizAnswers: AnswerQuizDto[] = JSON.parse(result.quiz_answer || '[]');
    const quizIds = quizAnswers.map((quiz) => quiz.id);
    const quizzes = await this.quizModel.find(
      {
        _id: { $in: quizIds },
        deleted_at: null,
      },
    );
    return {
      result: result,
      data_quiz: quizzes,
    }
  }
}
