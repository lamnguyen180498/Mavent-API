import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './v1/users/users.module';
import { AuthModule } from './v1/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { MailService } from './base/mail.service';
import { allowRoutes, excludeRoutes, middlewares } from './middleware';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './v1/jwt/jwt-config.service';
import { configs } from './config';
import { MailerModule } from 'nestjs-mailer';
import { CoursesModule } from './v1/courses/courses.module';
import { CategoriesModule } from './v1/categories/categories.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { OrdersModule } from './v1/orders/orders.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CityModule } from './v1/city/city.module';
import { DistrictsModule } from './v1/districts/districts.module';
import { WardsModule } from './v1/wards/wards.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CliModule } from './cli/cli.module';
import { ConsoleModule } from '@squareboat/nest-console';
import { TeachersModule } from './v1/teachers/teachers.module';
import { UserCourseModule } from './v1/user-course/user-course.module';
import { QuizModule } from './v1/quiz/quiz.module';
import { ZoomModule } from './zoom/zoom.module';
import { LessonModule } from './v1/lesson/lesson.module';
import { LessonController } from './v1/lesson/lesson.controller';
import { VnPayModule } from './v1/vnpay/vnpay.module';
import { StudentsModule } from './v1/students/students.module';
import { SubscribeModule } from './v1/subscribe/subscribe.module';
import { ExportExcelModule } from './v1/export-excel/export-excel.module';
import KeyvRedis from '@keyv/redis';
import { WalletModule } from './v1/wallet/wallet.module';
import { WalletTransactionModule } from './v1/wallet-transaction/wallet-transaction.module';
import { BlogsModule } from './v1/blogs/blogs.module';
import { CommentModule } from './v1/comment/comment.module';
import { SearchModule } from './v1/search/search.module';
import { CalendarModule } from './v1/calendar/calendar.module';
import { QuizTestModule } from './v1/quiz-test/quiz-test.module';
import { SettingsModule } from './v1/settings/settings.module';
import { ReviewsModule } from './v1/reviews/reviews.module';
import { TagsModule } from './v1/tags/tags.module';
import { ResultModule } from './v1/result/result.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        stores: [
          new KeyvRedis(
            configService.get('database.cache.connect'),
            configService.get('database.cache.options'),
          ),
        ],
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: configs,
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.getOrThrow('app.i18n.locale'),
        fallbacks: configService.get('app.i18n.fallbacks'),
        loaderOptions: {
          path: join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('database.mongo.uri'),
        autoIndex: configService.get('app.env') !== 'production',
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      useClass: MailService,
      inject: [MailService],
    }),
    JwtModule.registerAsync({
      useClass: JwtConfigService,
      global: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database.bull'),
    }),
    ScheduleModule.forRoot(),
    ConsoleModule,
    CliModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    CategoriesModule,
    OrdersModule,
    TasksModule,
    CityModule,
    DistrictsModule,
    WardsModule,
    TeachersModule,
    CoursesModule,
    UserCourseModule,
    QuizModule,
    ZoomModule,
    LessonModule,
    VnPayModule,
    StudentsModule,
    SubscribeModule,
    ExportExcelModule,
    WalletModule,
    WalletTransactionModule,
    BlogsModule,
    CommentModule,
    SearchModule,
    CalendarModule,
    QuizTestModule,
    SettingsModule,
    ReviewsModule,
    TagsModule,
    ResultModule
  ],
  controllers: [AppController, LessonController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(...middlewares)
      .exclude(...excludeRoutes)
      .forRoutes(allowRoutes);
  }
}
