import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Guest } from '../../decorators/auth.decorator';
import { FindAllCommentDto } from './dto/find-all-comment.dto';
import { Request } from 'express';
import { UserDocument } from '../../schemas/user.schema';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller({ path: 'comments', version: '1' })
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @Guest()
  findAll(
    @Query() query: FindAllCommentDto,
    @Req() req: Request & { user?: UserDocument },
  ) {
    return this.commentService.findAllComment(query, req.user._id);
  }
  @Post()
  async createComment(
    @Body() body: CreateCommentDto,
    @Req() req: Request & { user?: UserDocument },
  ) {
    return this.commentService.createComment(body, req.user._id);
  }

  @Put(':id')
  async updateComment(
    @Param('id') id: Types.ObjectId,
    @Body() body: UpdateCommentDto,
    @Req() req: Request & { user?: UserDocument },
  ) {
    return this.commentService.updateComment(id, body, req.user._id);
  }

  @Delete(':id')
  async deleteComment(
    @Param('id') id: Types.ObjectId,
    @Req() req: Request & { user?: UserDocument },
  ) {
    return this.commentService.deleteComment(id, req.user._id);
  }
}
