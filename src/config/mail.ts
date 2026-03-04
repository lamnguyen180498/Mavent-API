import * as process from 'process';

export default () => ({
  mail: {
    default: process.env.MAIL_MAILER || 'smtp',
    smtp: {
      host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAIL_PORT, 10) || 587,
      username: process.env.MAIL_USERNAME,
      password: process.env.MAIL_PASSWORD,
      encryption: process.env.MAIL_ENCRYPTION || 'tls',
      secure: process.env.MAIL_SECURE === 'true',
      debug: process.env.MAIL_DEBUG === 'true',
      logger: process.env.MAIL_LOGGER === 'true',
    },
    ses: {
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      sending_rate: process.env.AWS_SENDING_RATE,
      max_connections: process.env.AWS_MAX_CONNECTIONS,
    },
    from: {
      address: process.env.MAIL_FROM_ADDRESS || 'no-reply@localhost',
      name: process.env.MAIL_FROM_NAME || 'No Reply',
    },
  },
});
