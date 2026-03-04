import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Req,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '../../pipes/parse-object-id.pipe';
import { Types } from 'mongoose';
import { Quiz } from '../../schemas/quiz.schema';
import { UserDocument } from '../../schemas/user.schema';
import { PageDto } from '../../base/dto/page.dto';
import { ListQuizConditionDto } from './dto/list-quiz-condition.dto';

@ApiTags('Quiz')
@ApiBearerAuth()
@Controller({ version: '1', path: 'quiz' })
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @ApiOperation({ summary: 'Tạo câu hỏi' })
  @ApiOkResponse({ type: Quiz })
  @Post()
  create(
    @Body() createQuizDto: CreateQuizDto,
    @Req() req: { user: UserDocument },
  ) {
    return this.quizService.createQuiz(createQuizDto, req.user);
  }

  @ApiOperation({ summary: 'Nhập câu hỏi từ file Word' })
  @Post('import-word')
  @UseInterceptors(FileInterceptor('file'))
  async importWord(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: UserDocument },
  ) {
    return this.quizService.importWord(file.buffer, req.user);
  }

  @ApiOperation({ summary: 'Lấy danh sách câu hỏi' })
  @ApiOkResponse({ type: PageDto<Quiz> })
  @Get()
  findAll(
    @Query() query: ListQuizConditionDto,
    @Req() req: { user: UserDocument },
  ) {
    return this.quizService.findAllByCondition(query, req.user);
  }

  @ApiOperation({ summary: 'Lấy thông tin câu hỏi theo ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID câu hỏi' })
  @ApiOkResponse({ type: Quiz })
  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) _id: Types.ObjectId) {
    const quiz = await this.quizService.findOneByCondition(Quiz.name, { _id });

    if (quiz) {
      return quiz;
    }
    throw new NotFoundException();
  }

  @ApiOperation({ summary: 'Cập nhập câu hỏi' })
  @ApiParam({ name: 'id', type: String, description: 'ID câu hỏi' })
  @ApiOkResponse({ type: Quiz })
  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Body() updateQuizDto: UpdateQuizDto,
    @Req() req: { user: UserDocument },
  ) {
    return this.quizService.updateQuiz(_id, updateQuizDto, req.user);
  }

  @ApiOperation({ summary: 'Xóa câu hỏi theo ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID câu hỏi' })
  @Delete(':id')
  delete(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Req() req: { user: UserDocument },
  ) {
    return this.quizService.deleteQuiz(_id, req.user);
  }
}
