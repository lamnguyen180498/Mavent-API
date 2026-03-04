import { Injectable } from '@nestjs/common';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { ConfigService } from '@nestjs/config';
import { MailerModuleOptions, MailerModuleOptionsFactory } from 'nestjs-mailer';

@Injectable()
export class MailService implements MailerModuleOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerModuleOptions():
    | Promise<MailerModuleOptions>
    | MailerModuleOptions {
    const mailer = this.configService.get<string>('mail.default');

    let config = {
      defaults: {
        from: `"${this.configService.get(
          'mail.from.address',
        )}" <${this.configService.get('mail.from.name')}>`,
      },
    };

    switch (mailer) {
      case 'ses':
        config = { ...config, ...this.ses() };
        break;
      default:
        config = { ...config, ...this.smtp() };
        break;
    }

    return { config };
  }

  private smtp() {
    return {
      transport: {
        host: this.configService.get('mail.smtp.host'),
        port: this.configService.get('mail.smtp.port'),
        ignoreTLS: true,
        secure: this.configService.get('mail.smtp.secure', false),
        auth: {
          user: this.configService.get('mail.smtp.username'),
          pass: this.configService.get('mail.smtp.password'),
        },
      },
    };
  }

  private ses() {
    const region = this.configService.get('mail.ses.region');

    const sesClient = new SESv2Client({
      region,
      credentials: {
        accessKeyId: this.configService.get('mail.ses.key'),
        secretAccessKey: this.configService.get('mail.ses.secret'),
      },
    });

    const options = {
      SES: { sesClient, SendEmailCommand },
    };

    const sendingRate = this.configService.get('mail.ses.sending_rate');
    const maxConnections = this.configService.get('mail.ses.max_connections');

    if (sendingRate) Object.assign(options, { sendingRate: sendingRate });
    if (maxConnections)
      Object.assign(options, { maxConnections: maxConnections });

    return {
      transport: options,
    };
  }
}
