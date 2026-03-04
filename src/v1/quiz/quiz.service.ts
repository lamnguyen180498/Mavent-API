import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  EQuizType,
  Quiz,
  QuizAnswer,
  QuizAnswerInterface,
} from '../../schemas/quiz.schema';
import mammoth from 'mammoth';
import { Connection, Model, PipelineStage, Types } from 'mongoose';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { User, UserDocument } from '../../schemas/user.schema';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { ListQuizConditionDto } from './dto/list-quiz-condition.dto';
import { pipePagination } from 'src/helper/pagination';
import { omit } from 'lodash';

@Injectable()
export class QuizService extends BaseService {
  logger = new Logger(QuizService.name);

  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super({
      [Quiz.name]: quizModel,
    });
  }

  async findAllByCondition(query: ListQuizConditionDto, user: UserDocument) {
    const matchStage = {
      deleted_at: null,
    };
    // const realUser = new this.userModel(omit(user, 'is_admin'));
    // if (!realUser.isAdministrator()) {
    //   matchStage['creator_id'] = realUser._id;
    // }
    if (query.type) {
      matchStage['type'] = query.type;
    }
    if (query.tag_ids) {
      matchStage['tag_ids'] = { $in: query.tag_ids };
    }
    if (query.keyword) {
      matchStage['$or'] = [
        { content: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'updater_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                full_name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { _id: -1 } },
      {
        $project: {
          corrects: 0,
          answers: 0,
        },
      },
      ...pipePagination(query.page, query.limit),
    ];

    const data = await this.quizModel.aggregate(pipeline).exec();

    return data?.shift();
  }

  private buildQuizPayload(
    dto: CreateQuizDto | UpdateQuizDto,
    user: UserDocument,
    isCreate: boolean,
  ) {
    switch (dto.type) {
      case EQuizType.TrueFalse:
      case EQuizType.OneChoice:
      case EQuizType.MultipleChoice:
        if (
          !dto.answers ||
          !Array.isArray(dto.answers) ||
          dto.answers.length === 0
        ) {
          throw new NotFoundException('Không tìm thấy đáp án');
        }
        if (!dto.corrects || dto.corrects.length === 0) {
          throw new NotFoundException('Không tìm thấy đáp án đúng');
        }

        // Detect True/False based on having exactly 2 answers and 1 correct answer
        if (dto.answers.length === 2 && dto.corrects.length === 1) {
          dto.type = EQuizType.TrueFalse;
        }

        if (dto.type !== EQuizType.MultipleChoice && dto.corrects.length > 1) {
          throw new BadRequestException(
            'Câu hỏi chỉ được tồn tại một đáp án đúng',
          );
        }
        const answerIds = (dto.answers as QuizAnswer[]).map((a) => a.id);
        const allCorrectsValid = dto.corrects.every((correctId: string) =>
          answerIds.includes(correctId),
        );

        if (!allCorrectsValid) {
          throw new BadRequestException('Câu trả lời đúng không hợp lệ');
        }
        break;
      case EQuizType.Matching:
        if (
          !dto.answers ||
          !Array.isArray(dto.answers) ||
          dto.answers.length < 2
        ) {
          throw new NotFoundException('Đáp án câu hỏi ghép không hợp lệ');
        } else if (
          !Array.isArray(dto.answers[0]) ||
          !Array.isArray(dto.answers[1]) ||
          dto.answers[0].length < 2 ||
          dto.answers[0].length !== dto.answers[1].length
        ) {
          throw new NotFoundException('Đáp án câu hỏi ghép phải >= 2');
        }
        const checkValidAnswers = dto.answers.every((val) => {
          return (
            Array.isArray(val) &&
            val.length > 1 &&
            val.every((item: QuizAnswerInterface) => {
              return (
                item.id &&
                typeof item.id === 'string' &&
                item.text &&
                typeof item.text === 'string'
              );
            })
          );
        });
        if (!checkValidAnswers) {
          throw new BadRequestException('Đáp án câu hỏi ghép không hợp lệ');
        }
        dto.corrects = dto.answers[0].map(
          (item: QuizAnswerInterface, index: number) => {
            return `${item.id}:${dto.answers[1][index].id}`;
          },
        );
        break;
    }

    const payload: any = {
      ...dto,
      updater_id: user._id,
    };

    if (isCreate) {
      payload.creator_id = user._id;
    }
    return payload;
  }

  async createQuiz(createQuizDto: CreateQuizDto, user: UserDocument) {
    const payload = this.buildQuizPayload(createQuizDto, user, true);
    return this.quizModel.create(payload);
  }

  async updateQuiz(
    _id: Types.ObjectId,
    updateQuizDto: UpdateQuizDto,
    user: UserDocument,
  ) {
    const matchStage = {
      _id,
    };
    const realUser = new this.userModel(omit(user, 'is_admin'));
    if (!realUser.isAdministrator()) {
      matchStage['creator_id'] = realUser._id;
    }
    const payload = this.buildQuizPayload(updateQuizDto, user, false);
    const quiz = await this.quizModel.findOneAndUpdate(matchStage, payload, {
      new: true,
    });
    if (!quiz) {
      throw new NotFoundException(
        'Quiz không tồn tại hoặc không thuộc quyền truy cập',
      );
    }
    return quiz;
  }

  async deleteQuiz(_id: Types.ObjectId, user: UserDocument) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.quizModel.findByIdAndUpdate(
        _id,
        {
          deleted_at: new Date(),
          user_deleted_at: user._id,
        },
        { new: true, session },
      );
      await session.commitTransaction();
      return {
        statusCode: HttpStatus.OK,
        message: 'Xóa câu hỏi thành công',
      };
    } catch (e) {
      this.logger.error(e);
      await session.abortTransaction();
      throw new HttpException(
        'Có lỗi xảy ra, vui lòng thử lại',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async importWord(buffer: Buffer, user: UserDocument) {
    try {
      this.logger.log('Started synchronous processing for Word file import');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      const blocks = text
        .split(/(?=Câu\s+\d+[.:]\s*)/i)
        .filter((item) => item.trim().length > 0);

      const createdQuizzes = [];
      const failedQuestions = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i].trim();

        // If it doesn't look like a question block (e.g., a file title or introductory text), skip it completely without throwing an error
        if (!/^Câu\s+\d+[.:]\s*/i.test(block)) {
          continue;
        }

        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length < 3) {
          failedQuestions.push({
            content: lines[0] || 'Câu hỏi không xác định',
            reason: 'Không đủ số dòng (cần ít nhất câu hỏi và 2 đáp án)',
          });
          continue;
        }

        // Extract content and remove the "Câu X: " prefix
        let content = lines[0].replace(/^Câu\s+\d+[.:]\s*/i, '');
        // If the user put a newline immediately after "Câu X:", the first line is empty text, so take the next line
        if (!content && lines.length > 1) {
          content = lines[1];
          // Remove it from the lines array so we don't process it as an answer in the loop below
          lines.splice(1, 1);
        }
        const answers = [];
        let correctAnswerKeys = [];
        let note = '';

        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (/^[A-D][.:]/.test(line)) {
            const key = line.charAt(0).toUpperCase();
            const textAns = line.substring(2).trim();
            answers.push({ id: key, text: textAns });
          } else if (/^Đáp án\s*:/i.test(line)) {
            const rawKeys = line.split(':')[1].toUpperCase().trim();
            correctAnswerKeys = rawKeys
              .split(/[,;\s&]/)
              .map((k) => k.trim())
              .filter((k) => ['A', 'B', 'C', 'D'].includes(k));
          } else if (/^(Chú ý|Ghi chú|Note)\s*:/i.test(line)) {
            note = line.substring(line.indexOf(':') + 1).trim();
          }
        }

        if (answers.length > 0 && correctAnswerKeys.length > 0) {
          try {
            let type =
              correctAnswerKeys.length > 1
                ? EQuizType.MultipleChoice
                : EQuizType.OneChoice;

            // Detect True/False based on having exactly 2 answers and 1 correct answer (no text check needed)
            if (answers.length === 2 && correctAnswerKeys.length === 1) {
              type = EQuizType.TrueFalse;
            }

            // Validate that all correct answer keys exist in the provided answers
            const answerIds = answers.map((a) => a.id);
            const allCorrectsValid = correctAnswerKeys.every((correctId) =>
              answerIds.includes(correctId),
            );

            if (!allCorrectsValid) {
              failedQuestions.push({
                content,
                reason: `Đáp án đúng (${correctAnswerKeys.join(', ')}) không khớp với các lựa chọn đã cho.`,
              });
              continue;
            }

            const payload: any = {
              type,
              content,
              answers,
              corrects: correctAnswerKeys,
              note,
              tag_ids: [],
              creator_id: user._id,
              updater_id: user._id,
            };

            const newQuiz = await this.quizModel.create(payload);
            createdQuizzes.push(newQuiz);
          } catch (error) {
            failedQuestions.push({
              content,
              reason: error.message || 'Lỗi khi lưu vào cơ sở dữ liệu',
            });
          }
        } else {
          failedQuestions.push({
            content,
            reason: 'Thiếu đáp án (A,B,C,D) hoặc dòng "Đáp án:"',
          });
        }
      }

      this.logger.log(
        `Import Word File: ${createdQuizzes.length} success, ${failedQuestions.length} failed.`,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Hoàn tất quá trình đọc file Word.',
        data: {
          successCount: createdQuizzes.length,
          failedQuestions,
        },
      };
    } catch (error) {
      this.logger.error('Error processing word file import', error);
      throw new BadRequestException('Không thể đọc hoặc xử lý file word');
    }
  }
}
