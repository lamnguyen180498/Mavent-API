import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminWalletTransactionService } from './wallet-transaction.service';
import { FilterWalletTransactionDto } from '../dto/filter-wallet-transaction.dto';
import { UserDocument } from 'src/schemas/user.schema';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Wallet Transaction')
@Controller({
  version: '1',
  path: 'admin/wallet-transaction',
})
export class AdminWalletTransactionController {
  constructor(
    private readonly adminWalletTransactionService: AdminWalletTransactionService,
  ) {}

  @Get('withdrawal-requests')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả các yêu cầu rút tiền' })
  getAllWithdrawalRequests(@Query() query: FilterWalletTransactionDto) {
    return this.adminWalletTransactionService.getAllWithdrawalRequests(query);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Duyệt yêu cầu rút tiền' })
  approveWithdrawalRequest(
    @Param('id') id: string,
    @Req() req: { user: UserDocument },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.adminWalletTransactionService.approveWithdrawalRequest(
      id,
      req.user,
      files,
    );
  }

  @Post(':id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Từ chối yêu cầu rút tiền' })
  @ApiBody({
    schema: {
      properties: {
        note: { type: 'string' },
      },
    },
  })
  rejectWithdrawalRequest(
    @Param('id') id: string,
    @Body('note') note: string,
    @Req() req: { user: UserDocument },
  ) {
    return this.adminWalletTransactionService.rejectWithdrawalRequest(
      id,
      req.user,
      note,
    );
  }
}
