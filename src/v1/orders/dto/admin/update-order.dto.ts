import { PartialType } from '@nestjs/swagger';
import { AdminCreateOrderDto } from './create-order.dto';

export class AdminUpdateOrderDto extends PartialType(AdminCreateOrderDto) {}
