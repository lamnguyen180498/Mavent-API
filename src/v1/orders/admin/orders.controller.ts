import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserDocument } from 'src/schemas/user.schema';
import { ParseObjectIdPipe } from 'src/pipes/parse-object-id.pipe';
import { AdminOrdersService } from './orders.service';
import { AdminCreateOrderDto } from '../dto/admin/create-order.dto';
import { AdminFindOrderDto } from '../dto/admin/find-order.dto';
import { AdminUpdateOrderDto } from '../dto/admin/update-order.dto';
import { Types } from 'mongoose';

@ApiTags('Đơn hàng')
@ApiBearerAuth()
@Controller({
  path: 'admin/orders',
  version: '1',
})
export class AdminOrdersController {
  constructor(private readonly ordersService: AdminOrdersService) {}

  @Post()
  @ApiBearerAuth()
  async createOrder(
    @Body() body: AdminCreateOrderDto,
    @Req() req: Request & { user: UserDocument },
  ) {
    return await this.ordersService.createOrder(body, req?.user);
  }

  @Get()
  async findOrders(@Query() query: AdminFindOrderDto) {
    return this.ordersService.findAllOrder(query);
  }

  @Get(':id')
  async findOrderById(@Param('id', ParseObjectIdPipe) _id: Types.ObjectId) {
    return await this.ordersService.findOrderById(_id);
  }

  @Patch(':id')
  async updateOrder(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Body() body: AdminUpdateOrderDto,
  ) {
    return await this.ordersService.updateOrder(_id, body);
  }
}
