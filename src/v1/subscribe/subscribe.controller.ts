import { Controller, Get, Post, Body, Query, Res, Patch, Param } from '@nestjs/common';
import { SubscribeService } from './subscribe.service';
import { CreateSubscribeDto } from './dto/create-subscribe.dto';
import { Guest } from '../../decorators/auth.decorator';
import { FindSubscribeDto } from './dto/find-subscribe.dto';
import { ExportSubscribeDto } from './dto/export-subscribe.dto';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '../../pipes/parse-object-id.pipe';
import { Types } from 'mongoose';
@ApiBearerAuth()
@Controller({
  path: 'subscribes',
  version: '1',
})
export class SubscribeController {
  constructor(private readonly subscribeService: SubscribeService) {}

  @Guest()
  @Post()
  create(@Body() createSubscribeDto: CreateSubscribeDto) {
    return this.subscribeService.create(createSubscribeDto);
  }

  @Get()
  findAll(@Query() query: FindSubscribeDto) {
    return this.subscribeService.findAll(query);
  }

  @Get('export')
  exportToExcel(@Query() query: ExportSubscribeDto, @Res() res: Response) {
    return this.subscribeService.exportToExcel(query, res);
  }

  @Patch(':id/contacted')
  @ApiOperation({
    summary: 'Đánh dấu đã liên hệ',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Id subscribe',
  })
  async markAsContacted(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.subscribeService.updateContactedStatus(id, true);
  }
}
