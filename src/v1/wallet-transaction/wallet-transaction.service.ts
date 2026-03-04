import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWalletTransactionDto } from './dto/create-wallet-transaction.dto';
import { Model, PipelineStage, Types } from 'mongoose';
import { BaseService } from 'src/base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTransactionStatus,
  WalletTransactionType,
} from 'src/schemas/wallet-transaction.schema';
import { Wallet, WalletDocumnet } from 'src/schemas/wallet.schema';
import { UserDocument } from 'src/schemas/user.schema';
import { VnPayService } from '../vnpay/vnpay.service';
import { UpdateWalletTransactionDto } from './dto/update-wallet-transaction.dto';
import { FilterWalletTransactionDto } from './dto/filter-wallet-transaction.dto';
import { pipePagination } from 'src/helper/pagination';
import { EPaymentGateway, ETransactionPrefix } from 'src/schemas/order.schema';

@Injectable()
export class WalletTransactionService extends BaseService {
  logger = new Logger(WalletTransactionService.name);
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocumnet>,
    @InjectModel(WalletTransaction.name)
    private walletTransactionModel: Model<WalletTransactionDocument>,
    @Inject(forwardRef(() => VnPayService))
    private readonly vnpayService: VnPayService,
  ) {
    super({});
  }

  async createWalletTransaction(
    user: UserDocument,
    body: CreateWalletTransactionDto,
    ip: string,
  ) {
    const wallet = await this.walletModel.findOne({
      user_id: user._id,
    });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');

    const createData = {
      wallet_id: wallet._id,
      type: body.type,
      amount: body.amount,
      payment_gateway: body.payment_gateway,
      status: WalletTransactionStatus.PENDING,
      bank_name: body.bank_name,
      bank_code: body.bank_code,
      account_number: body.account_number,
      note: body.note,
      created_by: user._id,
    };
    const session = await this.walletTransactionModel.startSession();
    session.startTransaction();
    try {
      const walletTransaction = new this.walletTransactionModel(createData);
      await walletTransaction.save({ session });
      if (walletTransaction.type === WalletTransactionType.WITHDRAW) {
        await this.walletModel.findByIdAndUpdate(walletTransaction.wallet_id, {
          $inc: { balance: -walletTransaction.amount },
        });
      }

      let linkCheckout: string;
      if (walletTransaction.type == WalletTransactionType.DEPOSIT) {
        if (walletTransaction) {
          switch (walletTransaction.payment_gateway) {
            case EPaymentGateway.VNPay:
              linkCheckout = this.vnpayService.createPaymentUrl(
                walletTransaction._id.toString(),
                walletTransaction.amount,
                ip,
                {
                  orderInfo: `${
                    ETransactionPrefix.DEPOSIT
                  }=${walletTransaction._id.toString()}`,
                },
              );
              break;
            case EPaymentGateway.SePay:
              linkCheckout = `https://qr.sepay.vn/img?bank=${
                process.env.BANK_NAME
              }&acc=${
                process.env.BANK_ACCOUNT
              }&template=compact&amount=${Math.floor(
                walletTransaction.amount,
              )}&des=${ETransactionPrefix.DEPOSIT}=${walletTransaction._id}`;
          }
        }
      }
      await session.commitTransaction();
      return {
        statusCode: HttpStatus.OK,
        linkCheckout,
        message: 'Tạo yêu cầu thành công',
      };
    } catch (e) {
      this.logger.error(e);
      await session.abortTransaction();
      throw new HttpException(
        'Có lỗi xảy ra, vui lòng thử lại',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async updateWalletTransaction(
    walletTransactionId: Types.ObjectId,
    data: UpdateWalletTransactionDto,
  ) {
    const session = await this.walletTransactionModel.startSession();
    session.startTransaction();

    try {
      const update = await this.walletTransactionModel.findOneAndUpdate(
        { _id: walletTransactionId, status: WalletTransactionStatus.PENDING },
        data,
        { new: true, session },
      );
      if (
        update?.type === WalletTransactionType.DEPOSIT &&
        data.status === WalletTransactionStatus.APPROVED
      ) {
        await this.walletModel.findByIdAndUpdate(
          update.wallet_id,
          { $inc: { balance: data.amount } },
          { new: true, session },
        );
      }

      if (
        update?.type === WalletTransactionType.WITHDRAW &&
        data.status === WalletTransactionStatus.APPROVED
      ) {
        const updatedWallet = await this.walletModel.findOneAndUpdate(
          {
            _id: update.wallet_id,
            balance: { $gte: data.amount },
          },
          { $inc: { balance: -data.amount } },
          { new: true, session },
        );

        if (!updatedWallet) {
          throw new Error('Số dư không đủ để rút tiền');
        }
      }

      await session.commitTransaction();
      return update;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getTransaction(user: UserDocument, body: FilterWalletTransactionDto) {
    const wallet = await this.walletModel.findOne({
      user_id: user._id,
    });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');

    const match = {
      wallet_id: wallet._id,
    };
    if (body.type) {
      match['type'] = Array.isArray(body.type) ? { $in: body.type } : body.type;
    }
    if (body.status) {
      match['status'] = Array.isArray(body.status)
        ? { $in: body.status }
        : body.status;
    }
    const condition: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $sort: { created_at: -1 },
      },
      ...pipePagination(body.page, body.limit),
    ];

    const transactions = await this.walletTransactionModel.aggregate(condition);
    return transactions.shift();
  }
}
