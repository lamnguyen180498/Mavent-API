import { Controller, Get, Post, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserDocument } from 'src/schemas/user.schema';

@ApiTags('Wallet')
@Controller({
  version: '1',
  path: 'wallet',
})
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOkResponse({ description: 'Thông tin ví' })
  async getBalance(@Req() req: { user: UserDocument }) {
    return await this.walletService.getUserWallet(req.user._id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Tạo ví' })
  async createWallet(@Req() req: { user: UserDocument }) {
    return await this.walletService.createWallet(req.user._id);
  }
}
