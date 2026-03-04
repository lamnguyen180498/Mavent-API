import { Injectable } from '@nestjs/common';
import { InjectMailer, Mailer } from 'nestjs-mailer';
import { template } from './helper/email';

@Injectable()
export class AppService {
  constructor(@InjectMailer() private readonly mailer: Mailer) {}

  getHello(): string {
    return 'Hello World!';
  }

  async sendMail() {
    try {
      await this.mailer.sendMail({
        to: 'tmtung144@gmail.com', // list of receivers
        from: 'info@mavenpath.edu.vn', // sender address
        subject: 'Testing Nest MailerModule ✔', // Subject line
        // text: 'welcome', // plaintext body
        // html: '<b>welcome</b>', // HTML body content
        html: await template('src/templates/emails/welcome.ejs', {
          // Data to be sent to template engine.
          code: 'cf1a3f828287',
          username: 'john doe',
        }),
      });

      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
