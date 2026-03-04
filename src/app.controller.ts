import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Guest } from './decorators/auth.decorator';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ZoomService } from './zoom/zoom.service';

// import dayjs from 'dayjs';

@Guest()
@Controller({ version: '1' })
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly zoomService: ZoomService,
  ) {}

  @ApiExcludeEndpoint()
  @Get('mail-test')
  sendEmailTest() {
    return this.appService.sendMail();
  }

  // @ApiExcludeEndpoint()
  // @Get('zoom-test')
  // createZoomTest() {
  //   return this.zoomService.createMeeting({
  //     type: 2,
  //     topic: 'Test Meeting',
  //     start_time: dayjs().add(6, 'days').toISOString(),
  //     duration: 30,
  //     timezone: 'Asia/Ho_Chi_Minh',
  //     password: '123456',
  //   });
  // }

  @ApiExcludeEndpoint()
  @Get('zoom-live')
  getLive() {
    return this.zoomService.getLive();
  }

  @ApiExcludeEndpoint()
  @Get('zoom-user')
  getUserZoomInfo() {
    return this.zoomService.getUserInfo();
  }

  @ApiExcludeEndpoint()
  @Get('zoom-meeting')
  getZoomMeetingInfo(@Query('id') id: string) {
    return this.zoomService.getMeetingInfo(id);
  }
}
