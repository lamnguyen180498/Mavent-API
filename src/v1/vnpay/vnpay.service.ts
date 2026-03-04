import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { Request } from 'express';
import { Model, Types } from 'mongoose';
import {
  EPaymentStatus,
  ETransactionPrefix,
  Order,
} from 'src/schemas/order.schema';
import { VnPayLog } from 'src/schemas/vnpay-log.schema';
import { AdminOrdersService } from '../orders/admin/orders.service';
import { VnpayOrderType } from 'src/enums/vnpay-order-type';
import {
  WalletTransaction,
  WalletTransactionStatus,
} from 'src/schemas/wallet-transaction.schema';
import { WalletTransactionService } from '../wallet-transaction/wallet-transaction.service';

@Injectable()
export class VnPayService {
  private readonly logger = new Logger(VnPayService.name);

  private readonly vnp_TmnCode = process.env.VNP_TMNCODE;
  private readonly vnp_HashSecret = process.env.VNP_HASH_SECRET;
  private readonly vnp_Url = process.env.VNP_URL;
  private readonly vnp_ReturnUrl = process.env.VNP_RETURN_URL;

  constructor(
    @Inject(forwardRef(() => AdminOrdersService))
    private readonly adminOrdersService: AdminOrdersService,
    @Inject(forwardRef(() => WalletTransactionService))
    private readonly walletTransactionService: WalletTransactionService,
    @InjectModel(WalletTransaction.name)
    private readonly walletTransactionModel: Model<WalletTransaction>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(VnPayLog.name) private readonly vnPayLogModel: Model<VnPayLog>,
  ) {}

  private sortObject(obj) {
    const sorted = {};
    const str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  createPaymentUrl(
    orderId: string,
    amount: number,
    ipAddr: string,
    options?: {
      orderInfo?: string;
      orderType?: string;
      bankCode?: string;
      locale?: string;
    },
  ): string {
    let vnpUrl = this.vnp_Url;
    const orderType = options?.orderType || VnpayOrderType.BILL_PAYMENT;

    const vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = options?.orderInfo || '';
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = this.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = dayjs().format('YYYYMMDDHHmmss');
    vnp_Params['vnp_ExpireDate'] = dayjs()
      .add(15, 'minute')
      .format('YYYYMMDDHHmmss');

    if (options?.bankCode) {
      vnp_Params['vnp_BankCode'] = options.bankCode;
    }

    const sortedParams = this.sortObject(vnp_Params);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const querystring = require('qs');
    const signData = querystring.stringify(sortedParams, { encode: false });
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    sortedParams['vnp_SecureHash'] = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
    vnpUrl += '?' + querystring.stringify(sortedParams, { encode: false });

    return vnpUrl;
  }

  private parseAndVerifyParams(req: Request) {
    const params = { ...req.query };
    const secureHash = params['vnp_SecureHash'];
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(params);

    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const signed = crypto
      .createHmac('sha512', this.vnp_HashSecret)
      .update(signData, 'utf8')
      .digest('hex');

    return {
      vnp_Params: params,
      secureHash,
      signed,
    };
  }

  async getVnPayIPNReturn(req: Request) {
    const returnData = { RspCode: '', Message: '' };

    const dataValidate = this.parseAndVerifyParams(req);
    const ipAddress = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const rawParams = req.query;

    try {
      if (dataValidate.secureHash !== dataValidate.signed) {
        return this.buildResponse(returnData, '97', 'Invalid signature');
      }

      const orderId = dataValidate.vnp_Params['vnp_TxnRef']?.toString();
      const orderInfo = dataValidate.vnp_Params['vnp_OrderInfo']?.toString();
      const transactionId =
        dataValidate.vnp_Params['vnp_TransactionNo']?.toString();

      if (!Types.ObjectId.isValid(orderId)) {
        return this.buildResponse(returnData, '01', 'Order not found');
      }

      // Tách loại giao dịch + ID từ orderInfo
      const regex = /^([A-Z]+)\s*([a-f0-9]{24})$/i;
      const matches = orderInfo?.match(regex);
      if (!matches) {
        return this.buildResponse(returnData, '01', 'Invalid order info');
      }

      const type = matches[1]; // Loại giao dịch
      const amount = +dataValidate.vnp_Params['vnp_Amount'] / 100;
      const isSuccess =
        dataValidate.vnp_Params['vnp_ResponseCode'] === '00' &&
        dataValidate.vnp_Params['vnp_TransactionStatus'] === '00';

      if (type === ETransactionPrefix.DEPOSIT) {
        return await this.handleDeposit(
          orderId,
          amount,
          isSuccess,
          transactionId,
          returnData,
        );
      }

      if (type === ETransactionPrefix.BUY_COURSE) {
        return await this.handleBuyCourse(
          orderId,
          amount,
          isSuccess,
          returnData,
        );
      }

      return this.buildResponse(returnData, '01', 'Unknown transaction type');
    } catch (e) {
      this.logger.error(e);
      this.buildResponse(returnData, '99', 'Unknown error');
    } finally {
      await this.vnPayLogModel.create({
        rawJson: rawParams,
        orderId: rawParams['vnp_TxnRef']?.toString(),
        responseCode: rawParams['vnp_ResponseCode'],
        transactionStatus: rawParams['vnp_TransactionStatus'],
        secureHash: rawParams['vnp_SecureHash'],
        verificationResult:
          dataValidate.secureHash === dataValidate.signed ? 'success' : 'fail',
        resultMessage: returnData.Message,
        rspCode: returnData.RspCode,
        ipAddress,
      });
    }

    return returnData;
  }

  private async handleDeposit(
    orderId: string,
    amount: number,
    isSuccess: boolean,
    transactionId: string,
    returnData: { RspCode: string; Message: string },
  ) {
    const walletTransaction = await this.walletTransactionModel.findById(
      new Types.ObjectId(orderId),
    );

    if (!walletTransaction) {
      return this.buildResponse(returnData, '01', 'Order not found');
    }

    if (walletTransaction.amount !== amount) {
      return this.buildResponse(returnData, '04', 'Invalid amount');
    }

    if (walletTransaction.status !== WalletTransactionStatus.PENDING) {
      return this.buildResponse(returnData, '02', 'Order already confirmed');
    }

    const status = isSuccess
      ? WalletTransactionStatus.APPROVED
      : WalletTransactionStatus.CANCELED;
    await this.walletTransactionService.updateWalletTransaction(
      walletTransaction._id,
      {
        status,
        transaction_id: transactionId,
        approved_at: new Date(),
        amount: walletTransaction.amount,
      },
    );

    return this.buildResponse(returnData, '00', 'Confirm Success');
  }

  private async handleBuyCourse(
    orderId: string,
    amount: number,
    isSuccess: boolean,
    returnData: { RspCode: string; Message: string },
  ) {
    const order = (
      await this.orderModel.findById(new Types.ObjectId(orderId))
    )?.toObject();

    if (!order) {
      return this.buildResponse(returnData, '01', 'Order not found');
    }

    if (order.total_money !== amount) {
      return this.buildResponse(returnData, '04', 'Invalid amount');
    }

    if (order.payment_status === EPaymentStatus.Paid) {
      return this.buildResponse(returnData, '02', 'Order already confirmed');
    }

    const status = isSuccess ? EPaymentStatus.Paid : EPaymentStatus.Error;
    await this.adminOrdersService.updateOrderStatus(orderId, status);

    return this.buildResponse(returnData, '00', 'Confirm Success');
  }

  private buildResponse(returnData, code: string, message: string) {
    returnData.RspCode = code;
    returnData.Message = message;
    return returnData;
  }
}
