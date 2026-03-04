import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { QuizTestService } from './quiz-test.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { UserDocument } from '../../schemas/user.schema';
import { SelectListQuizTestDto } from './dto/find-quiz-test.dto';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../../pipes/parse-object-id.pipe';
import { GetTestLearnDto } from './dto/get-test-learn.dto';
@Controller({
  version: '1',
  path: 'quiz-test',
})

export class QuizTestController {
  constructor(private readonly quizTestService: QuizTestService) {}
  @Get('select-list')
  @ApiOperation({
    summary: 'Danh sách bkt (title + _id)',
  })
  async selectList(
    @Query() query: SelectListQuizTestDto,
    @Req() req: { user: UserDocument },
  ) {
    return await this.quizTestService.selectList(query, req.user);
  }

  @Get(':id/question')
  @ApiOperation({
    summary: 'Lấy thông tin câu hỏi làm bài thi theo ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  async getStartQuiz(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Query() query: GetTestLearnDto,
  ) {
    return this.quizTestService.getQuizLearn(_id, query);
  }
}
