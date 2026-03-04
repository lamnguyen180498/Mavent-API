import { forwardRef, Module } from '@nestjs/common';
import { WalletTransactionService } from './wallet-transaction.service';
import { WalletTransactionController } from './wallet-transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from 'src/schemas/wallet-transaction.schema';
import { HttpModule } from '@nestjs/axios';
import { VnPayModule } from '../vnpay/vnpay.module';
import { Wallet, WalletSchema } from 'src/schemas/wallet.schema';
import { AdminWalletTransactionController } from './admin/wallet-transaction.controller';
import { AdminWalletTransactionService } from './admin/wallet-transaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    HttpModule,
    forwardRef(() => VnPayModule),
  ],
  controllers: [WalletTransactionController, AdminWalletTransactionController],
  providers: [WalletTransactionService, AdminWalletTransactionService],
  exports: [WalletTransactionService, AdminWalletTransactionService],
})
export class WalletTransactionModule {}
