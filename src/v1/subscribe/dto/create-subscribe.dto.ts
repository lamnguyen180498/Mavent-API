import { PartialType } from '@nestjs/swagger';
import { Subscribe } from '../../../schemas/subscribe.schema';

export class CreateSubscribeDto extends PartialType(Subscribe) {}
