import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/v1/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { omit } from 'lodash';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';
import {
  decryptAES,
  encryptAES,
  extractBeforeEmail,
} from '../../helper/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { RegisterDto } from './dto/register.dto';
import { LoginSocialDto } from './dto/login-social.dto';
import { OAuth2Client } from 'google-auth-library';
import { HttpService } from '@nestjs/axios';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { HttpStatusCode } from 'axios';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { createHash } from 'node:crypto';
import { Address } from 'nodemailer/lib/mailer';

interface RegisterData extends RegisterDto {
  ip: string;
  password: string;
}

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly httpService: HttpService,
    @InjectQueue('auth') private authQueue: Queue,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  async loginSocial(provider: string, body: LoginSocialDto) {
    switch (provider) {
      case 'google':
        return this.verifyGoogle(body);
      case 'facebook':
        return this.verifyFacebook(body);
      default:
        throw new NotFoundException('Không hỗ trợ MXH này');
    }
  }

  async verifyFacebook(body: LoginSocialDto) {
    const lang = I18nContext.current().lang;
    let facebookUser = undefined;
    try {
      const res = await this.httpService.axiosRef.get<{
        data: {
          [key: string]: any;
        };
      }>(`https://graph.facebook.com/${body.facebook.version}/me`, {
        params: {
          access_token: body.token,
          fields: body.facebook.fields,
        },
      });

      facebookUser = res.data;
    } catch (e) {
      this.logger.error(e);
    }

    if (!facebookUser)
      throw new UnauthorizedException(
        this.i18n.t('auth.LOGIN.invalid_facebook_account', { lang }),
      );

    if (!facebookUser.email)
      throw new ForbiddenException(
        this.i18n.t('auth.LOGIN.missing_email_from_social', { lang }),
      );

    return this._resolveLoginSocial(
      facebookUser.email,
      `${facebookUser.first_name} ${facebookUser.last_name}`,
    );
  }

  async verifyGoogle(body: LoginSocialDto) {
    const lang = I18nContext.current().lang;
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: body.token,
      audience: this.configService.get('GOOGLE_AUTH_CLIENT_ID'),
    });
    const payload = ticket.getPayload();

    if (!payload)
      throw new UnauthorizedException(
        this.i18n.t('auth.LOGIN.invalid_google_account', { lang }),
      );

    const email = payload['email'];
    if (!email)
      throw new ForbiddenException(
        this.i18n.t('auth.LOGIN.missing_email_from_social', { lang }),
      );

    return this._resolveLoginSocial(email, payload['name']);
  }

  async login(username_email: string, password: string) {
    const lang = I18nContext.current().lang;
    const user = await this.usersService.findByUsernameOrEmail(username_email);
    if (!user || !compareSync(password, user?.password)) {
      throw new UnauthorizedException();
    }

    if (user.deleted_at) {
      throw new HttpException(
        this.i18n.t('auth.LOGIN.user_deleted', { lang }),
        HttpStatusCode.Forbidden,
      );
    }

    const payload = {
      sub: user._id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: await this.generateAccessToken(payload),
      refresh_token: await this.generateRefreshToken(payload),
      user_id: user._id,
    };
  }

  async loginAs(userId: string) {
    const lang = I18nContext.current()?.lang || 'vi';
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('auth.LOGIN.user_not_found', { lang, defaultValue: 'Người dùng không tồn tại' })
      );
    }

    if (user.deleted_at) {
      throw new HttpException(
        this.i18n.t('auth.LOGIN.user_deleted', { lang }),
        HttpStatusCode.Forbidden,
      );
    }

    const payload = {
      sub: user._id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: await this.generateAccessToken(payload),
      refresh_token: await this.generateRefreshToken(payload),
      user_id: user._id,
    };
  }

  async forgotPassword(email: string, userIp?: string, userAgent?: string) {
    const lang = I18nContext.current()?.lang || 'vi';
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new HttpException(
        this.i18n.t('auth.FORGET_PASSWORD.not_found', { lang }),
        HttpStatus.NOT_FOUND,
      );
    }

    if (user?.reset_password_sent_at) {
      const sentAt = dayjs(user.reset_password_sent_at);
      const now = dayjs();
      const limitMinutes = 30;
      const elapsedMinutes = now.diff(sentAt, 'minute');
      const remainingMinutes = limitMinutes - elapsedMinutes;
      if (remainingMinutes > 0) {
        throw new HttpException(
          this.i18n.t('auth.FORGET_PASSWORD.resend_limit', {
            lang,
            args: { minute: remainingMinutes },
          }),
          HttpStatusCode.BadRequest,
        );
      }
    }

    // xử lý tạo đường dẫn cấp lại mật khẩu
    const rawData = {
      email,
      timer: dayjs().add(1, 'day').unix(),
    };

    const encrypted = encryptAES(
      JSON.stringify(rawData),
      createHash('sha256').update('mavenpath_forget_password').digest(),
    );

    const code = encodeURIComponent(
      Buffer.from(JSON.stringify(encrypted)).toString('base64'),
    );

    const contentEmail = {
      ...rawData,
      toName: user.full_name,
      from: this.configService.get<Address>('mail.from'),
      link: `${process.env.APP_URL}/reset-password?code=${code}`,
    };

    await this.authQueue.add('mail-forgot-password', {
      subject: this.i18n.t('auth.FORGET_PASSWORD.subject_email', { lang }),
      from: this.configService.get<Address>('mail.from'),
      email,
      content: contentEmail,
      user_id: user._id,
      user_ip: userIp,
      user_agent: userAgent,
    });

    user.reset_password_sent_at = new Date();
    user.reset_password_token = code;
    await user.save();

    return {
      statusCode: 201,
      message: this.i18n.t('auth.FORGET_PASSWORD.sending', { lang }),
    };
  }

  async register(userInput: RegisterData) {
    const lang = I18nContext.current().lang;
    const existUserEmail = await this.usersService.findByEmail(userInput.email);
    if (existUserEmail) {
      throw new HttpException(
        this.i18n.t('auth.REGISTER.exists_email', { lang }),
        HttpStatus.CONFLICT,
      );
    }

    const existUsername = await this.usersService.findByUsername(
      userInput.username,
    );
    if (existUsername) {
      throw new HttpException(
        this.i18n.t('auth.REGISTER.exists_username', { lang }),
        HttpStatus.CONFLICT,
      );
    }

    const userInfo = omit(
      {
        ...userInput,
        password: userInput.password,
      },
      '_password',
    );
    await this.resolveRegister(userInfo);
    return this.i18n.t('auth.REGISTER.created_user', { lang });
  }

  generateLinkVerifyEmail(email: string) {
    const token = this.jwtService.sign(
      { email },
      {
        secret: this.configService.get('APP_KEY'),
        algorithm: 'HS256',
        expiresIn: '30d',
      },
    );

    return {
      from: process.env.MAIL_FROM || 'info@mavenpath.edu.vn',
      link: `${process.env.APP_URL || 'https://mavenpath.edu.vn'
        }/verify_email?_token=${token}`,
    };
  }

  async resolveRegister(userInfo: { [key: string]: any }) {
    const lang = I18nContext.current().lang;

    const newUser = await this.usersService.create<UserDocument>(
      User.name,
      userInfo,
    );

    await this.authQueue.add('mail-register', {
      user: userInfo,
      ...this.generateLinkVerifyEmail(userInfo.email),
      subject: this.i18n.t('auth.REGISTER.success_register', { lang }),
    });

    return newUser;
  }

  public async refreshToken(user: UserDocument, refreshToken: string) {
    const payload = this.jwtService.decode(refreshToken);

    if (
      typeof payload === 'object' &&
      payload.sub &&
      !user._id.equals(payload.sub)
    ) {
      throw new UnauthorizedException();
    }

    user.important_change_at = dayjs().subtract(1, 'second').toDate();
    await user.save();

    const newPayload = {
      sub: user._id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: await this.generateAccessToken(newPayload),
      refresh_token: await this.generateRefreshToken(newPayload),
      user_id: newPayload.sub,
    };
  }

  async sendVerificationEmail(user: UserDocument) {
    const lang = I18nContext.current().lang;
    if (!user) {
      throw new HttpException(
        this.i18n.t('auth.VERIFY_EMAIL.email_required', { lang }),
        HttpStatusCode.BadRequest,
      );
    }
    const userData = await this.usersService.findByEmail(user.email);

    if (!userData) {
      throw new NotFoundException(
        this.i18n.t('auth.VERIFY_EMAIL.user_not_found', { lang }),
      );
    }
    if (!userData?.email) {
      throw new HttpException(
        this.i18n.t('auth.VERIFY_EMAIL.email_required', { lang }),
        HttpStatusCode.BadRequest,
      );
    }
    if (userData?.verify_email_at) {
      throw new HttpException(
        this.i18n.t('auth.VERIFY_EMAIL.already_verified', { lang }),
        HttpStatusCode.BadRequest,
      );
    }
    if (userData?.email_verification_sent_at) {
      const sentAt = dayjs(user.email_verification_sent_at);
      const now = dayjs();
      const limitMinutes = 5;
      const elapsedMinutes = now.diff(sentAt, 'minute');
      const remainingMinutes = limitMinutes - elapsedMinutes;
      if (remainingMinutes > 0) {
        throw new HttpException(
          this.i18n.t('auth.VERIFY_EMAIL.resend_limit', {
            lang,
            args: { minute: remainingMinutes },
          }),
          HttpStatusCode.BadRequest,
        );
      }
    }
    await this.authQueue.add('mail-verify', {
      user: userData,
      ...this.generateLinkVerifyEmail(userData.email),
      subject: this.i18n.t('auth.VERIFY_EMAIL.subject_email', {
        lang,
      }),
    });
    return {
      statusCode: HttpStatusCode.Ok,
      message: this.i18n.t('auth.VERIFY_EMAIL.sending', { lang }),
    };
  }

  async updateEmailVerificationSentAt(userId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      email_verification_sent_at: new Date(),
    });
  }

  async verifyEmail(token: string) {
    const lang = I18nContext.current().lang;
    const payload = this.jwtService.verify(token, {
      secret: this.configService.get('APP_KEY'),
      algorithms: ['HS256'],
    });
    if (!payload || !payload.email) {
      throw new HttpException(
        this.i18n.t('auth.VERIFY_EMAIL.invalid_token', { lang }),
        HttpStatusCode.BadRequest,
      );
    }

    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('auth.VERIFY_EMAIL.user_not_found', { lang }),
      );
    }

    if (user.verify_email_at) {
      return {
        statusCode: HttpStatusCode.Ok,
        message: this.i18n.t('auth.VERIFY_EMAIL.already_verified', { lang }),
      };
    }

    user.verify_email_at = new Date();
    await user.save();

    const p = { sub: user._id, email: user.email, username: user.username };

    return {
      statusCode: HttpStatusCode.Ok,
      access_token: await this.generateAccessToken(p),
      refresh_token: await this.generateRefreshToken(p),
      message: this.i18n.t('auth.VERIFY_EMAIL.success', { lang }),
    };
  }

  async resetPassword(body: ResetPasswordDto) {
    let decrypted: string;

    try {
      const encryptedString = Buffer.from(
        decodeURIComponent(body.code),
        'base64',
      ).toString('utf8');
      const encryptedData = JSON.parse(encryptedString);
      decrypted = decryptAES(
        encryptedData,
        createHash('sha256').update('mavenpath_forget_password').digest(),
      );
    } catch {
      throw new BadRequestException('Liên kết không hợp lệ');
    }

    let payload: { email: string; timer: number };
    try {
      payload = JSON.parse(decrypted);
    } catch {
      throw new BadRequestException('Token bị lỗi');
    }

    if (!payload.email || !payload.timer) {
      throw new BadRequestException('Thiếu thông tin trong token');
    }

    if (dayjs().unix() > payload.timer) {
      throw new BadRequestException('Liên kết đã hết hạn');
    }

    const user = await this.userModel.findOneAndUpdate(
      {
        email: payload.email,
        reset_password_token: encodeURIComponent(body.code),
      },
      {
        $set: {
          password: body.password,
          important_change_at: new Date(),
          reset_password_token: null,
        },
      },
      { new: true },
    );
    if (!user) {
      throw new BadRequestException('Liên kết đã hết hạn');
    }

    return { message: 'Mật khẩu đã được cập nhật thành công' };
  }

  protected async _resolveLoginSocial(email: string, fullName: string) {
    const lang = I18nContext.current().lang;
    let user = await this.usersService.findByEmail(email);
    let isNewUser = false;
    if (!user) {
      user = await this.resolveRegister({
        email: email,
        verify_email_at: new Date(),
        password: hashSync(extractBeforeEmail(email), genSaltSync()),
        full_name: fullName,
      });
      isNewUser = true;
    }

    if (user.deleted_at) {
      throw new HttpException(
        this.i18n.t('auth.LOGIN.user_deleted', { lang }),
        403,
      );
    }

    const p = { sub: user._id, email: user.email, username: user.username };

    return {
      access_token: await this.generateAccessToken(p),
      refresh_token: await this.generateRefreshToken(p),
      user_id: user._id,
      is_new_user: isNewUser,
    };
  }

  private generateAccessToken(payload: object) {
    return this.jwtService.signAsync(payload);
  }

  private generateRefreshToken(payload: object) {
    return this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });
  }
}
