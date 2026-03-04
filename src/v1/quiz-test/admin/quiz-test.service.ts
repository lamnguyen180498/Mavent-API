import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '../../../base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { QuizTest, QuizTestOptionSelectQuizEnum, } from '../../../schemas/quiz-test.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { Quiz } from '../../../schemas/quiz.schema';
import { QuizResult } from '../../../schemas/quiz-result.schema';
import { CreateQuizTestDto } from '../dto/create-quiz-test.dto';
import { UserDocument } from '../../../schemas/user.schema';
import { UpdateQuizTestDto } from '../dto/update-quiz-test.dto';
import { AddQuizToTestDto } from '../dto/add-quiz-to-test.dto';
import { FindResultsDto } from '../dto/find-results.dto';
import { deleteFile, generateRandomPin, uploadFile, } from '../../../helper/common';
import { pipePagination } from '../../../helper/pagination';

@Injectable()
export class AdminQuizTestService extends BaseService {
  constructor(
    @InjectModel(QuizTest.name) private readonly quizTestModel: Model<QuizTest>,
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @InjectModel(QuizResult.name)
    private readonly quizResultModel: Model<QuizResult>,
  ) {
    super({
      [QuizTest.name]: quizTestModel,
    });
  }
  async createQuizTest(
    createQuizTestDto: CreateQuizTestDto,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<QuizTest> {
    const data = {
      ...createQuizTestDto,
      creator_id: user._id,
      updater_id: user._id,
      code: await this.getCodeQuizTest(),
    }
    if (file) {
      const urlImage = await uploadFile(
        file,
        `${generateRandomPin()}_${Date.now()}_quiz_test_avatar`,
        'quiz_test_avatars',
      );
      Object.assign(data, { thumbnail: urlImage });
    }
    const quizTest = new this.quizTestModel(data);
    return quizTest.save();
  }

  async getCodeQuizTest() {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // từ 1 đến 9
    let result = firstDigit.toString();

    for (let i = 0; i < 7; i++) {
      result += Math.floor(Math.random() * 10); // từ 0 đến 9
    }
    const oldItem = await this.quizTestModel.findOne({
      $or: [{ code: result }, { code_join_quiz: result }],
    });
    return oldItem ? this.getCodeQuizTest() : result;
  }

  async updateQuizTest(
    _id: Types.ObjectId,
    updateQuizTestDto: UpdateQuizTestDto,
    user: UserDocument,
    file?: Express.Multer.File,
  ) {
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
    let totalQuiz = quizTest.total_quiz || 0;
    const unset = {};
    let removes = [];
    if (updateQuizTestDto.option_select_quiz != null) {
      switch (updateQuizTestDto.option_select_quiz) {
        case QuizTestOptionSelectQuizEnum.RandomList:
          totalQuiz = updateQuizTestDto.list_random.reduce(
            (total, item) => total + item.number,
            0,
          );
          removes = ['quiz_ids', 'tag_random_ids', 'number_quiz_random'];
          break
        case QuizTestOptionSelectQuizEnum.Random:
          totalQuiz = updateQuizTestDto.number_quiz_random;
          removes = ['quiz_ids', 'list_random'];
          break
        case QuizTestOptionSelectQuizEnum.Select:
          totalQuiz = updateQuizTestDto.quiz_ids.length;
          removes = ['tag_random_ids', 'number_quiz_random', 'list_random'];
          break
        default:
          throw new HttpException(
            'Kiểu lấy câu hỏi không hợp lệ',
            HttpStatus.BAD_REQUEST,
          );
      }
    }
    removes.forEach((item) => {
      unset[item] = '';
      delete updateQuizTestDto[item];
    });

    const updatePayload: any = {
      $set: {
        ...updateQuizTestDto,
        updater_id: user._id,
        total_quiz: totalQuiz,
      }
    };
    if (Object.keys(unset).length > 0) {
      updatePayload.$unset = unset;
    }
    if (file) {
      // Nếu có ảnh cũ, thực hiện xóa
      if (quizTest?.thumbnail) {
        try {
          await deleteFile(quizTest.thumbnail);
        } catch (error) {
          console.error('Lỗi khi xóa ảnh cũ:', error);
        }
      }

      updatePayload.$set.thumbnail = await uploadFile(
        file,
        `${generateRandomPin()}_${Date.now()}_quiz_test_avatar`,
        'quiz_test_avatars',
      );
    }

    return this.quizTestModel.findOneAndUpdate(
      _id,
      updatePayload,
      { new: true }
    );
  }

  async addQuizToTest(
    _id: Types.ObjectId,
    body: AddQuizToTestDto,
    user: UserDocument,
  ) {
    let total_quiz = 0;
    const unset = {};
    let removes = [];
    switch (body.option_select_quiz) {
      case QuizTestOptionSelectQuizEnum.RandomList:
        removes = ['quiz_ids', 'tag_random_ids', 'number_quiz_random'];
        total_quiz = body.list_random.reduce(
          (total, item) => total + item.number,
          0,
        );
        break;
      case QuizTestOptionSelectQuizEnum.Random:
        removes = ['quiz_ids', 'list_random'];
        total_quiz = body.number_quiz_random;
        break;
      case QuizTestOptionSelectQuizEnum.Select:
        removes = ['tag_random_ids', 'number_quiz_random', 'list_random'];
        total_quiz = body.quiz_ids.length;
        break;
      default:
        throw new HttpException(
          'Kiểu lấy câu hỏi không hợp lệ',
          HttpStatus.BAD_REQUEST,
        );
    }
    removes.forEach((item) => {
      unset[item] = '';
      delete body[item];
    });

    const quizTest = await this.quizTestModel.findOneAndUpdate(
      {
        _id,
        deleted_at: null,
      },
      {
        $set: {
          ...body,
          total_quiz,
          updater_id: user._id,
        },
        $unset: unset,
      },
      { upsert: false, new: true },
    );
    if (quizTest) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Cập nhật câu hỏi thành công',
      };
    }
    throw new HttpException(
      'Không tìm thấy bài kiểm tra',
      HttpStatus.NOT_FOUND,
    );
  }
  async findOneQuizTest(_id: Types.ObjectId, user: UserDocument) {
    return this.quizTestModel.findOne({
      _id,
      creator_id: user._id,
      deleted_at: null,
    });
  }

  async getResults(testId: Types.ObjectId, query: FindResultsDto, user: UserDocument) {
      const match = {
        test_id: testId,
      }
      if(query.keyword) {
        match['user_full_name'] = { $regex: query.keyword.trim(), $options: 'i' };
      }
      const pipeline: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $sort: { created_at: -1 },
      },
      ...pipePagination(query.page, query.limit),
    ];

   const quizTestResult = await this.quizResultModel.aggregate(pipeline)
    return quizTestResult.shift();
  }
}
