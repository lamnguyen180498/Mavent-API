import { Controller, Get, Req } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Request } from 'express';
import { UserDocument } from '../../schemas/user.schema';
@Controller({ path: 'calendars', version: '1' })
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  findByUser(@Req() req: Request & { user: UserDocument }) {
    return this.calendarService.findByUser(req.user._id);
  }

  @Get('/teacher')
  findByTeacher(@Req() req: Request & { user: UserDocument }) {
    return this.calendarService.findByTeacher(req.user._id);
  }
}
