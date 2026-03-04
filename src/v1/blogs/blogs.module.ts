import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { AdminBlogsController } from './admin/blogs.controller';
import { AdminBlogsService } from './admin/blogs.service';
import { Blog, BlogSchema } from 'src/schemas/blog.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogsController, AdminBlogsController],
  providers: [BlogsService, AdminBlogsService],
})
export class BlogsModule {}
