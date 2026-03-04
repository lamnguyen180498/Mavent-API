import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { QuizTestService } from '../quiz-test.service';
import { AdminQuizTestService } from './quiz-test.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiArrayResponse } from '../../../base/api/array-response';
import { QuizTest } from '../../../schemas/quiz-test.schema';
import { ApiFilterQuery } from '../../../base/api/filter-query';
import { UserDocument } from '../../../schemas/user.schema';
import {
  FilterFindQuizTest,
  FindQuizTestDto,
  SortFindQuizTest,
} from '../dto/find-quiz-test.dto';
import { CreateQuizTestDto } from '../dto/create-quiz-test.dto';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../../../pipes/parse-object-id.pipe';
import { UpdateQuizTestDto } from '../dto/update-quiz-test.dto';
import { FindResultsDto } from '../dto/find-results.dto';
import { AddQuizToTestDto } from '../dto/add-quiz-to-test.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller({
  version: '1',
  path: 'admin/quiz-test',
})
export class AdminQuizTestController {
  constructor(
    private readonly quizTestService: QuizTestService,
    private readonly adminQuizTestService: AdminQuizTestService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách quiz test' })
  @ApiArrayResponse(QuizTest, {})
  @ApiFilterQuery('filters', FilterFindQuizTest)
  @ApiFilterQuery('sort', SortFindQuizTest)
  async findAll(
    @Query() query: FindQuizTestDto,
    @Req() req: { user: UserDocument },
  ) {
    query.filters = { ...query.filters, creator_id: req.user._id };
    return this.quizTestService.findAllByCondition(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin quiz test theo ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  @ApiOkResponse({ type: QuizTest })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Bản dịch',
  })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: { user: UserDocument },
  ) {
    return this.adminQuizTestService.findOneQuizTest(id, req.user);
  }

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo quiz test' })
  @ApiOkResponse({ type: QuizTest })
  create(
    @Body() body: CreateQuizTestDto,
    @Req() req: { user: UserDocument },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminQuizTestService.createQuizTest(body, req.user, file);
  }

  @Patch('/:id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật quiz test' })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Bản dịch',
  })
  @ApiOkResponse({ type: QuizTest })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: UpdateQuizTestDto,
    @Req() req: { user: UserDocument },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminQuizTestService.updateQuizTest(id, body, req.user, file);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa quiz test theo ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Bản dịch',
  })
  delete(@Param('id', ParseObjectIdPipe) _id: Types.ObjectId) {
    return this.quizTestService.softDelete(QuizTest.name, _id);
  }

  @Patch('/:id/add-quiz')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm câu hỏi vào quiz test' })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Bản dịch',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  async addQuizToTest(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: AddQuizToTestDto,
    @Req() req: { user: UserDocument },
  ) {
    return this.adminQuizTestService.addQuizToTest(id, body, req.user);
  }

  @Get('/:id/results')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy kết quả thi của học viên' })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Bản dịch',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID quiz test',
  })
  async getResults(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: FindResultsDto,
    @Req() req: { user: UserDocument },
  ) {
    return this.adminQuizTestService.getResults(id, query, req.user);
  }
}
