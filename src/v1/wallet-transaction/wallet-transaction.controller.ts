import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { WalletTransactionService } from './wallet-transaction.service';
import { CreateWalletTransactionDto } from './dto/create-wallet-transaction.dto';
import { UserDocument } from 'src/schemas/user.schema';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterWalletTransactionDto } from './dto/filter-wallet-transaction.dto';

@ApiTags('Wallet Transaction')
@Controller({
  version: '1',
  path: 'wallet-transaction',
})
export class WalletTransactionController {
  constructor(
    private readonly walletTransactionService: WalletTransactionService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo yêu cầu nạp/rút tiền' })
  create(
    @Body() body: CreateWalletTransactionDto,
    @Req() req: Request & { user: UserDocument },
  ) {
    return this.walletTransactionService.createWalletTransaction(
      req.user,
      body,
      req.ip,
    );
  }

  @Get()
  @ApiBearerAuth()
  getTransaction(
    @Query() query: FilterWalletTransactionDto,
    @Req() req: { user: UserDocument },
  ) {
    return this.walletTransactionService.getTransaction(req.user, query);
  }
}
