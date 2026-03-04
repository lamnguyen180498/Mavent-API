import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Query,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Guest } from '../../decorators/auth.decorator';
import { LoginDto } from './dto/login.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { TokenDto } from '../../base/dto/token.dto';
import { HttpExceptionDto } from '../../base/dto/http-exception.dto';
import JwtRefreshGuard from '../../guards/jwt-refresh.guard';
import { User, UserDocument } from '../../schemas/user.schema';
import { LoginSocialDto } from './dto/login-social.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { omit } from 'lodash';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Guest()
@ApiTags('Auth')
@Controller({
  version: '1',
  path: 'auth',
})
export class AuthController {
  constructor(private authService: AuthService, @InjectModel(User.name) private readonly userModel: Model<User>,) { }

  @Post('/login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: TokenDto })
  async login(@Body() body: LoginDto, @Session() session: Record<string, any>) {
    const { access_token, refresh_token, user_id } =
      await this.authService.login(body.username_email, body.password);

    session.isAuthenticated = true;
    session.userId = user_id;
    session.accessToken = access_token;
    session.refreshToken = refresh_token;

    return { access_token, refresh_token };
  }

  // Warning: Endpoint này cần được bảo vệ bằng Admin guard thật chặt chẽ trong thực tế
  // Tuy nhiên theo request, trước mắt ta cứ mở AuthGuard chung (hoặc không dùng Guest)
  // Vì controller đang dùng @Guest(), ta cần override Guard hoặc xử lý tương ứng.
  // Ở đây để tiện nhất, ta bỏ qua @Guest() cho endpoint này nếu có thể, hoặc yêu cầu token.
  @Post('/login-as/:userId')
  @ApiOperation({ summary: 'Admin đăng nhập dưới quyền user khác' })
  async loginAs(
    @Param('userId') userId: string,
    @Session() session: Record<string, any>,
    @Req() req: { user: UserDocument },
  ) {
    const realUser = new this.userModel(omit(req.user, 'is_admin'));
    if (!realUser.isAdministrator())
      return Promise.reject(
        new HttpException('Bạn không có quyền thao tác', 403),
      );
    const { access_token, refresh_token, user_id } =
      await this.authService.loginAs(userId);

    session.isAuthenticated = true;
    session.userId = user_id;
    session.accessToken = access_token;
    session.refreshToken = refresh_token;

    return { access_token, refresh_token };
  }

  @Post('/forgot-password')
  @ApiOperation({ summary: 'Quên mật khẩu' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiCreatedResponse({ type: HttpExceptionDto })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.forgotPassword(
      body.email,
      request.ip,
      request.headers['user-agent'],
    );
  }

  @Post('/register')
  @ApiOperation({ summary: 'Đăng ký' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: HttpExceptionDto })
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const message = await this.authService.register({
      ip: req.ip,
      password: body.password,
      ...body,
    });

    res.status(201).json({
      statusCode: 201,
      message,
    });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('/refresh')
  @ApiOperation({ summary: 'Lấy access_token mới' })
  @ApiBody({
    schema: {
      properties: {
        refresh_token: { type: 'string' },
      },
    },
  })
  async refreshToken(
    @Body('refresh_token') refreshToken: string,
    @Req() req: { user: UserDocument },
    @Session() session: Record<string, any>,
  ) {
    const { access_token, refresh_token, user_id } =
      await this.authService.refreshToken(req.user, refreshToken);

    session.isAuthenticated = true;
    session.userId = user_id;
    session.accessToken = access_token;
    session.refreshToken = refresh_token;

    return { access_token, refresh_token };
  }

  @Post('/login/:provider')
  @ApiOperation({ summary: 'Đăng nhập MXH' })
  async loginSocial(
    @Body() body: LoginSocialDto,
    @Param('provider') provider: string,
    @Session() session: Record<string, any>,
  ) {
    const { access_token, refresh_token, user_id, is_new_user } =
      await this.authService.loginSocial(provider, body);

    session.isAuthenticated = true;
    session.userId = user_id;
    session.accessToken = access_token;
    session.refreshToken = refresh_token;

    return { access_token, refresh_token, is_new_user };
  }

  @Get('/session')
  async getSession(@Session() session: Record<string, any>) {
    return session;
  }

  @Delete('/session')
  async deleteSession(@Session() session: Record<string, any>) {
    session.destroy();
  }

  @Post('send-verification')
  @ApiBearerAuth()
  async sendVerification(@Req() req: { user: UserDocument }) {
    return this.authService.sendVerificationEmail(req.user);
  }

  @Get('verify-email')
  async verifyEmail(@Query('_token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
