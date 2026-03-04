import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { BaseService } from '../../base/base.service';

import {
  EPaymentGateway,
  EPaymentStatus,
  EProcessStatus,
  ETransactionPrefix,
  Order,
} from '../../schemas/order.schema';
import { Course } from '../../schemas/course.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { InjectMailer, Mailer } from 'nestjs-mailer';
import { CreateOrderDto } from './dto/create-order.dto';
import { Counter } from '../../schemas/counter.schema';
import { EProductType, OrderDetail } from '../../schemas/order-detail.schema';
import { genSaltSync, hashSync } from 'bcrypt';
import { Request } from 'express';
import {
  ETypeSepay,
  TransactionSepay,
} from '../../schemas/transaction-sepay.schema';
import { AdminOrdersService } from './admin/orders.service';
import { WebhookSepayDto } from './dto/webhook-sepay';
import {
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from 'src/schemas/wallet-transaction.schema';
import { WalletTransactionService } from '../wallet-transaction/wallet-transaction.service';
import { Wallet, WalletStatus } from 'src/schemas/wallet.schema';
import { StudentsService } from '../students/students.service';

@Injectable()
export class OrdersService extends BaseService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectMailer() private readonly mailer: Mailer,
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(TransactionSepay.name)
    private readonly transactionSepayModel: Model<TransactionSepay>,
    @InjectModel(OrderDetail.name)
    private readonly orderDetailModel: Model<OrderDetail>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(forwardRef(() => AdminOrdersService))
    private readonly adminOrdersService: AdminOrdersService,
    @InjectModel(WalletTransaction.name)
    private readonly walletTransactionModel: Model<WalletTransaction>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<Wallet>,
    private readonly walletTransactionService: WalletTransactionService,
    private readonly studentsService: StudentsService,
  ) {
    super({ [Order.name]: orderModel, [Wallet.name]: walletModel });
  }

  async createOrder(body: CreateOrderDto, user?: UserDocument) {
    const dataOrder = {
      full_name: body.info_user?.full_name || user?.full_name,
      email: body.info_user?.email || user?.email,
      phone: body.info_user?.phone || user?.phone,
      address: body.info_user?.address || user?.address,
      city_id: body.info_user?.city_id || user?.city_id,
      ward_id: body.info_user?.ward_id || user?.ward_id,
      payment_type: body.payment_type,
      payment_gateway: body.payment_gateway,
    };

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const user = await this.userModel.findOneAndUpdate(
        {
          email: dataOrder.email,
          deleted_at: { $exists: false },
        },
        {
          $setOnInsert: {
            full_name: dataOrder.full_name,
            email: dataOrder.email,
            phone: dataOrder.phone,
            password: hashSync(dataOrder.email, genSaltSync()),
          },
        },
        {
          new: true,
          upsert: true,
        },
      );

      if (user) dataOrder['user_id'] = user._id;

      const dataOrderDetail = [];
      let totalMoney = 0;

      for (const product of body.products) {
        const lineTotal = product.product_price * product.product_quantity;
        totalMoney += lineTotal;

        const course = await this.courseModel.findById(product.product_id);
        if (!course) {
          throw new BadRequestException(
            `Không tìm thấy khóa học có ID:${product.product_id}`,
          );
        }

        dataOrderDetail.push({
          product_id: course._id,
          product_name: product.product_name,
          quantity: product.product_quantity,
          type: product.type || EProductType.Course,
          price: product.product_price,
          total_money: lineTotal,
          product_owner_id: course.owner_id,
          cohort_code: product.cohort_code,
          item_code: product.item_code,
        });
      }

      const order = new this.orderModel({
        ...dataOrder,
        total_money: totalMoney,
        creator_id: user?._id || null,
        process_status: EProcessStatus.New,
        payment_status:
          dataOrder.payment_gateway === EPaymentGateway.Wallet
            ? EPaymentStatus.Paid
            : EPaymentStatus.UnPaid,
      });

      const orderNew = await order.save({ session });

      const orderDetailsWithOrderId = dataOrderDetail.map((detail) => ({
        ...detail,
        order_id: orderNew._id,
      }));

      await this.orderDetailModel.insertMany(orderDetailsWithOrderId, {
        session,
      });

      if (user?._id && order.payment_gateway === EPaymentGateway.Wallet) {
        const amount = Number(order.total_money) || 0;

        const updatedWallet = await this.walletModel.findOneAndUpdate(
          {
            user_id: user._id,
            status: WalletStatus.ACTIVE,
            balance: { $gte: amount },
          },
          { $inc: { balance: -amount } },
          { new: true, session },
        );
        if (!updatedWallet) {
          throw new BadRequestException('Số dư không đủ');
        }

        const createData = {
          order_id: order._id,
          wallet_id: updatedWallet._id,
          type: WalletTransactionType.BUY,
          amount: amount,
          status: WalletTransactionStatus.APPROVED,
          created_by: user._id,
        };
        const walletTransaction = new this.walletTransactionModel(createData);
        await walletTransaction.save({ session });
        const coursesMapping = orderDetailsWithOrderId
          .filter((item) => Boolean(item.product_id))
          .map((item) => ({
            course_id: item.product_id,
            cohort_code: item.cohort_code,
          }));
        await this.studentsService.mapCourses(
          user._id,
          coursesMapping as any,
          session,
        );
      }

      await session.commitTransaction();
      return order;
    } catch (e) {
      this.logger.error(e);
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async handleSePayIPN(req: Request, body: WebhookSepayDto) {
    const authHeader = req.headers['authorization'] as string;
    const apiKey = authHeader?.startsWith('Apikey ')
      ? authHeader.slice(7).trim()
      : null;

    if (!apiKey || apiKey !== process.env.API_KEY_SEPAY) {
      this.logger.error('API Key không được cung cấp', apiKey);
    }

    const IDGG = body.id;
    const gateWay = body.gateway;
    const transactionContent = body.content;
    const transactionDate = body.transactionDate;
    const accountDumber = body.accountNumber;
    const subAccount = body.subAccount;
    const transferType = body.transferType;
    const transferAmount = body.transferAmount;
    const accumulated = body.accumulated;
    const code = body.code;
    const referenceNumber = body.referenceCode;

    await this.transactionSepayModel.create({
      id_gg: IDGG,
      gate_way: gateWay,
      transaction_date: transactionDate,
      account_number: accountDumber,
      sub_account: subAccount,
      amount: transferAmount,
      accumulated: accumulated,
      code: code,
      transaction_content: transactionContent,
      reference_number: referenceNumber,
      body: JSON.stringify(body),
      type: transferType === 'in' ? ETypeSepay.In : ETypeSepay.Out,
    });

    if (typeof transactionContent === 'string') {
      const regex = /\b([A-Z]+)([a-f0-9]{24})\b/i;
      const matches = transactionContent.match(regex);
      const type = matches[1];
      const orderId = matches[2];

      // Kiểm tra nếu có khớp với regex
      if (orderId && Types.ObjectId.isValid(orderId)) {
        switch (type) {
          case ETransactionPrefix.BUY_COURSE:
            const order = await this.orderModel.findById(
              new Types.ObjectId(orderId),
            );

            if (order && transferType === 'in') {
              await this.adminOrdersService.updateOrderStatus(
                orderId,
                EPaymentStatus.Paid,
              );
            } else {
              throw new BadRequestException(
                'Không tìm thấy đơn hàng hoặc không phải là giao dịch nạp tiền',
              );
            }
            break;
          case ETransactionPrefix.DEPOSIT:
            const walletTransaction =
              await this.walletTransactionModel.findById(orderId);
            if (walletTransaction && transferType === 'in') {
              await this.walletTransactionService.updateWalletTransaction(
                walletTransaction._id,
                {
                  status: WalletTransactionStatus.APPROVED,
                  transaction_id: IDGG,
                  approved_at: new Date(),
                  amount: walletTransaction.amount,
                },
              );
            } else {
              throw new BadRequestException(
                'Không tìm thấy đơn hàng hoặc không phải là giao dịch nạp tiền',
              );
            }
            break;
        }
      } else {
        throw new BadRequestException(
          'Không tìm thấy mã đơn hàng trong nội dung giao dịch',
        );
      }
    }
  }
}
