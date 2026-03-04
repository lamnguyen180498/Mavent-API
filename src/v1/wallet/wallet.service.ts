import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from 'src/schemas/wallet-transaction.schema';
import {
  Wallet,
  WalletDocumnet,
  WalletStatus,
} from 'src/schemas/wallet.schema';
import { BaseService } from 'src/base/base.service';

@Injectable()
export class WalletService extends BaseService {
  logger = new Logger(Wallet.name);
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocumnet>,
    @InjectModel(WalletTransaction.name)
    private walletTransactionModel: Model<WalletTransactionDocument>,
  ) {
    super({});
  }

  async getUserWallet(userId: Types.ObjectId) {
    const wallet = await this.walletModel.findOne({ user_id: userId });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');
    return wallet;
  }

  async createWallet(userId: Types.ObjectId) {
    if (!userId) throw new NotFoundException('Tài khoản không tồn tại');
    const wallet = await this.walletModel.findOne({
      user_id: userId,
    });
    if (wallet) return wallet;

    const session = await this.walletModel.startSession();
    session.startTransaction();
    try {
      const wallet = new this.walletModel({
        user_id: userId,
        balance: 0,
        status: WalletStatus.ACTIVE,
      });
      await wallet.save({ session });
      await session.commitTransaction();
      return wallet;
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
}
