import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VnPayService } from 'src/v1/vnpay/vnpay.service';
import { Request } from 'express';
import { Guest } from 'src/decorators/auth.decorator';

@ApiTags('VnPay')
@ApiBearerAuth()
@Controller({
  path: 'vnpay',
  version: '1',
})
export class VnPayController {
  constructor(private readonly vnpayService: VnPayService) {}

  @Get('ipn')
  @Guest()
  handleIpn(@Req() req: Request) {
    return this.vnpayService.getVnPayIPNReturn(req);
  }
}
