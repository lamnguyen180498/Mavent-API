import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ResultService } from './result.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserDocument } from '../../schemas/user.schema';
import { ParseObjectIdPipe } from '../../pipes/parse-object-id.pipe';
import { Types } from 'mongoose';
import { SaveResultDto } from './dto/save-result.dto';
import { QuizTest, QuizTestDocument } from '../../schemas/quiz-test.schema';
import { FindLastResultDto } from './dto/find-last-result.dto';
import { FindByConditionDto } from './dto/find-by-condition.dto';

@ApiTags('Result')
@ApiBearerAuth()
@Controller({
  version: '1',
  path: 'result',
})
export class ResultController {
  constructor(private readonly resultService: ResultService) { }

  @Post('save/:id')
  @ApiOperation({
    summary: 'Lưu kết quả làm bài',
  })
  @ApiBody({ type: SaveResultDto })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  async saveResult(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Body() body: SaveResultDto,
    @Req() req: { user: UserDocument },
  ) {
    const quizTest: QuizTestDocument =
      await this.resultService.findOneByCondition(QuizTest.name, {
        _id,
        deleted_at: null,
      });
    if (!quizTest) {
      throw new BadRequestException('Đề thi không tồn tại');
    }

    return this.resultService.saveResult(quizTest, body, req.user);
  }

  @Get('latest/:id')
  @ApiOperation({
    summary: 'Lấy kết quả làm bài mới nhất',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  async getLatestResult(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Query()query: FindLastResultDto,
    @Req() req: { user: UserDocument },
  ) {
    const result = await this.resultService.getLatestResult(
      _id,
      req.user,
      query
    );
    if (!result) return {};
    return result;
  }

  @Get('test/:id')
  @ApiOperation({
    summary: 'Lấy kết quả làm bài theo test id',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  async getByTest(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Query()query: FindByConditionDto,
    @Req() req: { user: UserDocument },
  ) {
    const result = await this.resultService.getByCondition(
      _id,
      req.user,
      query
    );
    if (!result) return {};
    return result;
  }

  @Get(':id/quiz-questions')
  @ApiOperation({
    summary: 'Lấy danh sách câu hỏi và câu trả lời theo kết quả làm bài',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz result',
  })
  async getListQuestionByResult(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Req() req: { user: UserDocument },
  ) {
    const result = await this.resultService.getListQuestionByResult(
      _id,
      req.user,
    );
    if (!result) return {};
    return result;
  }
}
