import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VnPayService } from './vnpay.service';
import { OrdersModule } from 'src/v1/orders/orders.module';
import { VnPayController } from './vnpay.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import { VnPayLog, VnPayLogSchema } from 'src/schemas/vnpay-log.schema';
import { WalletTransactionModule } from '../wallet-transaction/wallet-transaction.module';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from 'src/schemas/wallet-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: VnPayLog.name, schema: VnPayLogSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
    HttpModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => WalletTransactionModule),
  ],
  providers: [VnPayService],
  controllers: [VnPayController],
  exports: [VnPayService],
})
export class VnPayModule {}
