import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserDocument } from '../../schemas/user.schema';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { HttpExceptionDto } from 'src/base/dto/http-exception.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUserDto } from './dto/find-user.dto';

@ApiTags('User')
@Controller({
  version: '1',
  path: 'users',
})
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Hồ sơ cá nhân' })
  profile(@Req() req: { user: UserDocument }) {
    return this.usersService.findById(req.user._id);
  }

  @Patch()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'avatar', maxCount: 1 }]))
  async updateProfile(
    @Body() body: UpdateUserDto,
    @Req() req: { user: UserDocument },
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
    },
  ) {
    return await this.usersService.updateProfile(req.user, body, files);
  }

  @Patch('avatar')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Cập nhật avatar' })
  @ApiOkResponse({ type: HttpExceptionDto })
  async updateAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: 'image/jpeg|image/png|image/jpg' }),
        ],
        exceptionFactory: (error) => {
          throw new BadRequestException({
            statusCode: 400,
            message: 'File upload không hợp lệ',
            error: error,
          });
        },
      }),
    )
    file: Express.Multer.File,
    @Req() req: { user: UserDocument },
  ) {
    return await this.usersService.updateAvatar(req.user, file);
  }

  @Get('logout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Đăng xuất',
  })
  async logout(@Res() res: Response, @Req() req: { user: UserDocument }) {
    try {
      await this.usersService.logout(req.user._id);

      res.json({
        statusCode: 200,
        message: 'Đã thoát',
      });
    } catch (e) {
      throw new HttpException('Có lỗi khi thoát', 500);
    }
  }

  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa tài khoản cá nhân' })
  async delete(@Req() req: { user: UserDocument }, @Res() res: Response) {
    try {
      await this.usersService.update(
        User.name,
        {
          _id: req.user._id,
        },
        { $set: { deleted_at: new Date() } },
      );

      res.json({
        statusCode: HttpStatus.OK,
        message: 'Đã xóa tài khoản',
      });
    } catch (e) {
      throw new HttpException('Có lỗi khi xóa tài khoản', 500);
    }
  }

  @Get('exist')
  @ApiQuery({ name: 'email', type: 'string' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra email đã được sử dụng chưa' })
  @ApiOkResponse({ type: User })
  async ExistUser(@Query('email') email: string) {
    return await this.usersService.findByEmail(email);
  }

  @Get('list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách người dùng' })
  @ApiOkResponse({ type: [User] })
  async list(@Req() req: { user: UserDocument },@Query() query: FindUserDto) {
    return await this.usersService.findByCondition(query,req.user);
  }
}
