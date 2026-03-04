import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FindAllCommentDto } from './dto/find-all-comment.dto';
import { Connection, Model, Types } from 'mongoose';
import { BaseService } from '../../base/base.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { pipePagination } from '../../helper/pagination';
import { UserCourse } from '../../schemas/user-course.schema';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from '../../schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
@Injectable()
export class CommentService extends BaseService {
  logger = new Logger(CommentService.name);
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
    @InjectConnection() private readonly connection: Connection,
  ) {
    super({ [Comment.name]: commentModel });
  }
  async findAllComment(query: FindAllCommentDto, userId: Types.ObjectId) {
    const checkUserCourse = await this.userCourseModel
      .findOne({ user_id: userId, course_id: query.course_id })
      .lean();
    if (!checkUserCourse) {
      throw new HttpException(
        'Bạn không được xem bình luận cho khóa học này',
        HttpStatus.FORBIDDEN,
      );
    }
    const matchStage = {
      course_id: query.course_id,
      type: query.type,
      $or: [{ comment_id: null }, { comment_id: { $exists: false } }],
    };
    const [result] = await this.commentModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { _id: -1 } },
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
              },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'comments',
                let: { parentId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$comment_id', '$$parentId'] } } },
                  { $sort: { _id: 1 } },
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'user_id',
                      foreignField: '_id',
                      as: 'user',
                    },
                  },
                  {
                    $unwind: {
                      path: '$user',
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      content: 1,
                      created_at: 1,
                      updated_at: 1,
                      user: {
                        _id: '$user._id',
                        full_name: '$user.full_name',
                        avatar: '$user.avatar',
                      },
                    },
                  },
                ],
                as: 'replies',
              },
            },
            {
              $project: {
                _id: 1,
                content: 1,
                course_id: 1,
                user_id: 1,
                type: 1,
                created_at: 1,
                updated_at: 1,
                user: {
                  _id: '$user._id',
                  full_name: '$user.full_name',
                  avatar: '$user.avatar',
                },
                replies: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          data: 1,
          metadata: { $arrayElemAt: ['$metadata', 0] },
        },
      },
    ]);
    const total = result?.metadata?.total || 0;
    const hasMore = query.page * query.limit < total;

    return {
      items: result?.data || [],
      hasMore,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async updateComment(
    commentId: Types.ObjectId,
    body: UpdateCommentDto,
    userId: Types.ObjectId,
  ) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new HttpException('Không tìm thấy bình luận', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra user có quyền sửa
    if (comment.user_id.toString() !== userId.toString()) {
      throw new HttpException(
        'Bạn không có quyền sửa bình luận này',
        HttpStatus.FORBIDDEN,
      );
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      comment.content = body.content;
      await comment.save();
      return {
        statusCode: HttpStatus.OK,
        message: 'Sửa bình luận thành công',
        comment,
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

  async deleteComment(commentId: Types.ObjectId, userId: Types.ObjectId) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new HttpException('Không tìm thấy bình luận', HttpStatus.NOT_FOUND);
    }

    // Kiểm tra quyền
    if (comment.user_id.toString() !== userId.toString()) {
      throw new HttpException(
        'Bạn không có quyền xoá bình luận này',
        HttpStatus.FORBIDDEN,
      );
    }
    await this.commentModel.deleteOne({ _id: commentId });

    return {
      statusCode: HttpStatus.OK,
      message: 'Xoá bình luận thành công',
    };
  }

  async createComment(body: CreateCommentDto, userId: Types.ObjectId) {
    const session = await this.connection.startSession();
    session.startTransaction();
    const checkUserCourse = await this.userCourseModel
      .findOne({ user_id: userId, course_id: body.course_id })
      .session(session)
      .lean();

    if (!checkUserCourse) {
      throw new HttpException(
        'Bạn không được bình luận cho khóa học này',
        HttpStatus.FORBIDDEN,
      );
    }
    try {
      const comment = await this.commentModel.create(
        [
          {
            course_id: body.course_id,
            user_id: userId,
            content: body.content,
            comment_id: body.comment_id || null,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Thêm bình luận thành công',
        comment: comment[0],
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
}
