import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Model, PipelineStage } from 'mongoose';
import { BaseService } from 'src/base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { FilterWalletTransactionDto } from '../dto/filter-wallet-transaction.dto';
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTransactionStatus,
  WalletTransactionType,
} from 'src/schemas/wallet-transaction.schema';
import { pipePagination } from 'src/helper/pagination';
import { UserDocument } from 'src/schemas/user.schema';
import { Wallet, WalletDocumnet } from 'src/schemas/wallet.schema';
import { uploadFile } from 'src/helper/common';

@Injectable()
export class AdminWalletTransactionService extends BaseService {
  logger = new Logger(AdminWalletTransactionService.name);
  constructor(
    @InjectModel(WalletTransaction.name)
    private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocumnet>,
  ) {
    super({});
  }

  async getAllWithdrawalRequests(query: FilterWalletTransactionDto) {
    const match = {
      type: WalletTransactionType.WITHDRAW,
    };
    if (query.status) {
      match['status'] = Array.isArray(query.status)
        ? { $in: query.status }
        : query.status;
    }

    if (query.from_date && query.to_date) {
      match['created_at'] = {
        $gte: new Date(query.from_date),
        $lte: new Date(query.to_date),
      };
    } else if (query.from_date) {
      match['created_at'] = { $gte: new Date(query.from_date) };
    } else if (query.to_date) {
      match['created_at'] = { $lte: new Date(query.to_date) };
    }

    const pipeline: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'created_by',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                full_name: 1,
                email: 1,
                phone: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'approved_by',
          foreignField: '_id',
          as: 'approved_by',
          pipeline: [
            {
              $project: {
                full_name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$approved_by',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallet_id',
          foreignField: '_id',
          as: 'wallet',
          pipeline: [
            {
              $project: {
                balance: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$wallet',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { created_at: -1 },
      },
      ...pipePagination(query.page, query.limit),
    ];
    const transactions = await this.walletTransactionModel.aggregate(pipeline);
    return transactions.shift();
  }

  async approveWithdrawalRequest(
    id: string,
    user: UserDocument,
    files: Express.Multer.File[],
  ) {
    const session = await this.walletTransactionModel.startSession();
    session.startTransaction();

    try {
      const walletTransaction = await this.walletTransactionModel
        .findById(id)
        .session(session);
      if (!walletTransaction) {
        throw new HttpException(
          'Giao dịch không tồn tại',
          HttpStatus.NOT_FOUND,
        );
      }

      const wallet = await this.walletModel
        .findById(walletTransaction.wallet_id)
        .session(session);
      if (!wallet) {
        throw new HttpException('Ví không tồn tại', HttpStatus.NOT_FOUND);
      }

      const attachments: string[] = [];
      for (const file of files) {
        const link = await uploadFile(
          file,
          `${walletTransaction._id}-attachment-${Date.now()}`,
          'withdrawals',
        );
        if (link) attachments.push(link);
      }

      const update = await this.walletTransactionModel.findByIdAndUpdate(
        id,
        {
          status: WalletTransactionStatus.APPROVED,
          approved_by: user._id,
          approved_at: new Date(),
          attachments,
        },
        { new: true, session },
      );

      await session.commitTransaction();
      return update;
    } catch (e) {
      if (e instanceof HttpException) throw e;
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

  async rejectWithdrawalRequest(id: string, user: UserDocument, note: string) {
    const session = await this.walletTransactionModel.startSession();
    session.startTransaction();
    try {
      const update = await this.walletTransactionModel.findByIdAndUpdate(
        id,
        {
          status: WalletTransactionStatus.CANCELED,
          approved_by: user._id,
          approved_at: new Date(),
          note,
        },
        { new: true, session },
      );
      await this.walletModel.findOneAndUpdate(
        { _id: update.wallet_id },
        { $inc: { balance: update.amount } },
        { new: true, session },
      );
      await session.commitTransaction();
      return update;
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
