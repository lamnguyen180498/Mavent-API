import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { BullModule } from '@nestjs/bull';
import { Counter, CounterSchema } from '../../schemas/counter.schema';
import {
  OrderDetail,
  OrderDetailSchema,
} from '../../schemas/order-detail.schema';
import { VnPayModule } from 'src/v1/vnpay/vnpay.module';
import { AdminOrdersController } from './admin/orders.controller';
import { AdminOrdersService } from './admin/orders.service';
import { StudentsModule } from '../students/students.module';
import {
  TransactionSepay,
  TransactionSepaySchema,
} from '../../schemas/transaction-sepay.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from 'src/schemas/wallet-transaction.schema';
import { WalletTransactionModule } from '../wallet-transaction/wallet-transaction.module';
import { Wallet, WalletSchema } from 'src/schemas/wallet.schema';

export const importOrderModels = [
  { name: Order.name, schema: OrderSchema },
  { name: Counter.name, schema: CounterSchema },
  { name: User.name, schema: UserSchema },
  { name: Course.name, schema: CourseSchema },
  { name: Order.name, schema: OrderSchema },
  { name: OrderDetail.name, schema: OrderDetailSchema },
  { name: TransactionSepay.name, schema: TransactionSepaySchema },
  { name: WalletTransaction.name, schema: WalletTransactionSchema },
  { name: Wallet.name, schema: WalletSchema },
];

@Module({
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, AdminOrdersService],
  imports: [
    MongooseModule.forFeature([...importOrderModels]),
    BullModule.registerQueue({
      name: 'mail',
    }),
    forwardRef(() => VnPayModule),
    StudentsModule,
    WalletTransactionModule,
  ],
  exports: [OrdersService, AdminOrdersService],
})
export class OrdersModule {}
