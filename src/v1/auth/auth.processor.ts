import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectMailer, Mailer } from 'nestjs-mailer';
import { template } from '../../helper/email';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './auth.service';

@Processor('auth')
export class AuthProcessor {
  private readonly logger = new Logger(AuthProcessor.name);

  constructor(
    private authService: AuthService,
    @InjectMailer() private readonly mailer: Mailer,
    private readonly httpService: HttpService,
  ) {}

  @Process('mail-forgot-password')
  async handleMailForgotPassword(job: Job) {
    try {
      this.mailer.sendMail(
        {
          to: job.data.email,
          from: job.data.from,
          subject: job.data.subject,
          html: await template(
            'src/templates/emails/forgot-password.ejs',
            job.data.content,
          ),
        },
        (err, info) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(info.envelope);
          console.log(info.messageId);
        },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Process('mail-register')
  async handleMailRegister(job: Job) {
    this.logger.log('Processing mail register job:', job.data);
    try {
      this.mailer.sendMail(
        {
          to: job.data.user.email,
          from: job.data.from,
          subject: job.data.subject,
          html: await template('src/templates/emails/register.ejs', {
            toName: job.data.user.full_name,
            link: job.data.link,
          }),
        },
        (err, info) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(info.envelope);
          console.log(info.messageId);
        },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Process('mail-verify')
  async handleMailVerify(job: Job) {
    this.logger.log('Processing mail verify job:', job.data);
    const { user, from, subject, link } = job.data;
    try {
      this.mailer.sendMail(
        {
          to: user.email,
          from: from,
          subject: subject,
          html: await template(
            'src/templates/emails/verify_account_student.ejs',
            {
              toName: user.full_name,
              verifyUrl: link,
            },
          ),
        },
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
        },
      );
      await this.authService.updateEmailVerificationSentAt(user._id);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
