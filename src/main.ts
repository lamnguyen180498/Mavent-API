import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import chalk from 'chalk';
import { AppClusterService } from './app-cluster.service';
import process from 'node:process';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

const appPort = parseInt(process.env.APP_PORT, 10) || 3000;
const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.APP_ENV === 'production'
        ? WinstonModule.createLogger({
            exitOnError: false,
            transports: [
              new transports.DailyRotateFile({
                filename: `logs/%DATE%-error.log`,
                level: 'error',
                format: format.combine(format.timestamp(), format.json()),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: false,
                maxFiles: '30d',
              }),
              new transports.DailyRotateFile({
                filename: `logs/%DATE%-combined.log`,
                format: format.combine(format.timestamp(), format.json()),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: false,
                maxFiles: '30d',
              }),
              new transports.Console({
                format: format.combine(
                  format.timestamp(),
                  format.colorize(),
                  format.simple(),
                ),
              }),
            ],
          })
        : null,
  });
  const config = new DocumentBuilder()
    .setTitle('MavenPath Api doc')
    .setVersion('1.0')
    .addServer('v1', 'Version 1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      disableErrorMessages: process.env.APP_ENV === 'production',
      whitelist: true,
      stopAtFirstError: true,
    }),
  );

  app.useGlobalFilters(new I18nValidationExceptionFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // SESSION
  const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
      port: +process.env.REDIS_PORT || 6379,
      host: process.env.REDIS_HOST || '127.0.0.1',
    },
  });
  redisClient.connect().catch(console.error);

  const sessionConfig = {
    store: new RedisStore({
      client: redisClient,
      prefix: `${process.env.REDIS_PREFIX}-session:`,
      ttl: +process.env.SESSION_LIFETIME || 2 * 60 * 60 * 1000,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    name: process.env.SESSION_NAME,
    cookie: {
      maxAge: +process.env.SESSION_LIFETIME || 2 * 60 * 60 * 1000,
    },
  };

  app.getHttpAdapter().getInstance().set('trust proxy', true);
  app.use(session(sessionConfig));

  app.useStaticAssets(join(__dirname, '..', 'storage/app/public'), {
    prefix: '/storage/',
  });

  await app.listen(appPort);

  if (process.env.APP_DEBUG === 'true') {
    const mongoose = await import('mongoose');
    mongoose.set(
      'debug',
      async function (collectionName, methodName, ...methodArgs) {
        const stack = new Error().stack;
        const lastStackLine = stack
          ? stack.split('\n').pop()
          : 'Unknown stack trace';

        this.$print(collectionName, methodName, methodArgs, true);

        const formattedLog = `${chalk.green('File:')} ${chalk.gray(
          lastStackLine.trim(),
        )}`;

        console.info(formattedLog);
      },
    );
  }
}

if (process.env.APP_CLUSTER === 'true') {
  AppClusterService.clusterize(bootstrap);
} else bootstrap().then(() => logger.log(`App running with port: ${appPort}`));
