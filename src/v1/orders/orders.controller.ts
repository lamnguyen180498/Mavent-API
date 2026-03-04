import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { CreateOrderDto } from './dto/create-order.dto';
import { UserDocument } from '../../schemas/user.schema';
import { Guest } from '../../decorators/auth.decorator';
import { VnPayService } from 'src/v1/vnpay/vnpay.service';
import { Request } from 'express';
import {
  EPaymentGateway,
  ETransactionPrefix,
} from '../../schemas/order.schema';
import process from 'process';
import { WebhookSepayDto } from './dto/webhook-sepay';
import { Wallet, WalletStatus } from 'src/schemas/wallet.schema';

@ApiTags('Đơn hàng')
@ApiBearerAuth()
@Controller({
  path: 'orders',
  version: '1',
})
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly i18n: I18nService,
    private readonly vnpayService: VnPayService,
  ) {}

  @Post()
  @Guest()
  async createOrder(
    @Body() body: CreateOrderDto,
    @Req() req: Request & { user?: UserDocument },
  ) {
    if (!req.user && !body.info_user) {
      throw new HttpException(
        this.i18n.t('Vui lòng nhập thông tin khách hàng'),
        400,
      );
    }
    const totalPrice = body.products.reduce((sum, product) => {
      return sum + product.product_price * product.product_quantity;
    }, 0);
    if (totalPrice > 0) {
      if (req.user && body.payment_gateway == EPaymentGateway.Wallet) {
        const wallet = await this.ordersService.findOneByCondition<Wallet>(
          Wallet.name,
          {
            user_id: req.user._id,
            status: WalletStatus.ACTIVE,
          },
        );

        if (!wallet || totalPrice > Number(wallet.toObject().balance ?? 0)) {
          throw new HttpException('Số dư không đủ để thanh toán', 400);
        }
      }
      const newOrder = await this.ordersService.createOrder(body, req?.user);
      if (newOrder?._id) {
        let url = '';
        if (newOrder?.payment_gateway == EPaymentGateway.VNPay) {
          url = this.vnpayService.createPaymentUrl(
            newOrder?._id?.toString(),
            newOrder?.total_money,
            req.ip,
            {
              orderInfo: `${
                ETransactionPrefix.BUY_COURSE + newOrder._id.toString()
              }`,
            },
          );
        } else if (newOrder?.payment_gateway == EPaymentGateway.SePay) {
          url = `https://qr.sepay.vn/img?bank=${process.env.BANK_NAME}&acc=${
            process.env.BANK_ACCOUNT
          }&template=compact&amount=${Math.floor(newOrder.total_money)}&des=${
            ETransactionPrefix.BUY_COURSE + newOrder._id
          }`;
        } else if (newOrder?.payment_gateway == EPaymentGateway.Wallet) {
          return newOrder;
        }

        return { url };
      }
    } else {
      return;
    }
    throw new HttpException(
      'Đã có lỗi xảy ra! Vui lòng thử lại sau',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  @Post('sepay/ipn')
  @Guest()
  async handleSePayIPN(@Req() req: Request, @Body() body: WebhookSepayDto) {
    return this.ordersService.handleSePayIPN(req, body);
  }
}
