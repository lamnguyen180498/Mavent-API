import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, PipelineStage, Types } from 'mongoose';
import { InjectMailer, Mailer } from 'nestjs-mailer';
import { BaseService } from 'src/base/base.service';
import { Counter } from 'src/schemas/counter.schema';
import { Course } from 'src/schemas/course.schema';
import { OrderDetail, EProductType } from 'src/schemas/order-detail.schema';
import {
  Order,
  EProcessStatus,
  EPaymentStatus,
} from 'src/schemas/order.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import { AdminCreateOrderDto } from '../dto/admin/create-order.dto';
import { pipePagination } from 'src/helper/pagination';
import { AdminFindOrderDto } from '../dto/admin/find-order.dto';
import { AdminUpdateOrderDto } from '../dto/admin/update-order.dto';
import { StudentsService } from 'src/v1/students/students.service';
@Injectable()
export class AdminOrdersService extends BaseService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    @InjectMailer() private readonly mailer: Mailer,
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(OrderDetail.name)
    private readonly orderDetailModel: Model<OrderDetail>,
    @InjectConnection() private readonly connection: Connection,
    private readonly studentsService: StudentsService,
  ) {
    super({ [Order.name]: orderModel });
  }

  async createOrder(body: AdminCreateOrderDto, user?: UserDocument) {
    const { products, ...dataOrder } = body;

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const dataOrderDetail = [];
      let totalMoney = 0;

      for (const product of products) {
        const lineTotal = product.product_price * product.product_quantity;
        totalMoney += lineTotal;

        const course = await this.courseModel.findById(product.product_id);
        if (!course) {
          throw new BadRequestException(
            `Course with ID ${product.product_id} not found`,
          );
        }

        dataOrderDetail.push({
          product_id: course._id,
          product_name: product.product_name,
          quantity: product.product_quantity,
          type: product.type || EProductType.Course,
          price: product.product_price,
          product_owner_id: course.owner_id,
          cohort_code: product.cohort_code,
          item_code: product.item_code,
        });
      }

      const result = await this.orderModel.create(
        [
          {
            process_status: EProcessStatus.New,
            payment_status: EPaymentStatus.UnPaid,
            ...dataOrder,
            total_money: totalMoney,
            creator_id: user?._id || null,
          },
        ],
        { session },
      );

      const order = result.shift();

      const orderDetailsWithOrderId = dataOrderDetail.map((detail) => ({
        ...detail,
        order_id: order._id,
      }));

      await this.orderDetailModel.insertMany(orderDetailsWithOrderId, {
        session,
      });

      await session.commitTransaction();
      return order;
    } catch (e) {
      this.logger.error(e);
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async findAllOrder(query: AdminFindOrderDto) {
    const andConditions: any[] = [];

    if (query.keyword) {
      andConditions.push({
        $or: [
          { full_name: { $regex: query.keyword, $options: 'i' } },
          { email: { $regex: query.keyword, $options: 'i' } },
          { phone: { $regex: query.keyword, $options: 'i' } },
        ],
      });
    }

    if (query.payment_status !== undefined) {
      andConditions.push({ payment_status: query.payment_status });
    }

    if (query.process_status !== undefined) {
      andConditions.push({ process_status: query.process_status });
    }

    if (query.from_date && query.to_date) {
      andConditions.push({
        created_at: {
          $gte: new Date(query.from_date),
          $lte: new Date(query.to_date),
        },
      });
    } else if (query.from_date) {
      andConditions.push({
        created_at: { $gte: new Date(query.from_date) },
      });
    } else if (query.to_date) {
      andConditions.push({
        created_at: { $lte: new Date(query.to_date) },
      });
    }

    const matchStage: PipelineStage.Match = {
      $match: andConditions.length > 0 ? { $and: andConditions } : {},
    };
    const pipeline: PipelineStage[] = [
      matchStage,
      {
        $lookup: {
          from: 'order_details',
          localField: '_id',
          foreignField: 'order_id',
          as: 'order_details',
        },
      },
      { $sort: { created_at: -1 } },
      ...pipePagination(query.page, query.limit),
    ];

    return (await this.orderModel.aggregate(pipeline).exec()).shift();
  }

  async findOrderById(_id: Types.ObjectId) {
    const [order] = await this.orderModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(_id) } },
        {
          $lookup: {
            from: 'order_details',
            localField: '_id',
            foreignField: 'order_id',
            as: 'order_details',
            pipeline: [
              {
                $lookup: {
                  from: 'courses',
                  let: { pid: '$product_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$_id', '$$pid'] },
                      },
                    },
                    {
                      $project: { _id: 0, price: 1 },
                    },
                  ],
                  as: 'course',
                },
              },
              {
                $unwind: {
                  path: '$course',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  original_price: '$course.price',
                },
              },
              {
                $project: {
                  course: 0,
                },
              },
            ],
          },
        },
      ])
      .exec();

    return order || null;
  }

  async updateOrder(orderId: Types.ObjectId, body: AdminUpdateOrderDto) {
    const updateData = {
      address: body.address,
      city_id: body.city_id,
      ward_id: body.ward_id,
      note: body.note,
      process_status: body.process_status,
      payment_type: body.payment_type,
      payment_status: body.payment_status,
    };

    if (!body?.products || !Array.isArray(body.products)) {
      throw new BadRequestException(
        'Danh sách sản phẩm là bắt buộc và phải là mảng hợp lệ.',
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const incomingProducts = body.products;

      const incomingIds = incomingProducts
        .filter((p) => p.id)
        .map((p) => p.id.toString());

      // Lấy danh sách chi tiết đơn hàng đang có
      const existingDetails = await this.orderDetailModel
        .find({ order_id: orderId })
        .session(session);

      const existingIds = existingDetails.map((d) => d._id.toString());

      // Xoá các chi tiết order đã xóa trong mảng product gửi lên
      const toDeleteIds = existingIds.filter((id) => !incomingIds.includes(id));
      if (toDeleteIds.length > 0) {
        await this.orderDetailModel.deleteMany(
          { _id: { $in: toDeleteIds } },
          { session },
        );
      }

      // Tách mảng cập nhật và tạo mới sản phẩm trong order
      const toAdd = incomingProducts.filter((p) => !p.id);
      const toUpdate = incomingProducts.filter(
        (p) => p.id && existingIds.includes(p.id.toString()),
      );

      const allProductIds = [...toAdd, ...toUpdate].map((p) =>
        p.product_id.toString(),
      );
      const validProducts = await this.courseModel
        .find({ _id: { $in: allProductIds } })
        .session(session);

      const validProductIdSet = new Set(
        validProducts.map((p) => p._id.toString()),
      );

      // Kiểm tra product_id nào không tồn tại
      if (validProductIdSet.size !== allProductIds.length) {
        const missingIds = allProductIds.filter(
          (id) => !validProductIdSet.has(id),
        );
        throw new BadRequestException(
          `Các product_id không tồn tại trong hệ thống: ${missingIds.join(
            ', ',
          )}`,
        );
      }

      const docsToInsert = toAdd.map((p) => ({
        order_id: new Types.ObjectId(orderId),
        product_id: new Types.ObjectId(p.product_id),
        product_name: p.product_name,
        price: p.product_price,
        quantity: p.product_quantity,
        cohort_code: p.cohort_code,
        item_code: p.item_code,
      }));

      if (docsToInsert.length > 0) {
        await this.orderDetailModel.insertMany(docsToInsert, { session });
      }

      const bulkOps = toUpdate.map((p) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(p.id) },
          update: {
            $set: {
              product_id: new Types.ObjectId(p.product_id),
              product_name: p.product_name,
              price: p.product_price,
              quantity: p.product_quantity,
              cohort_code: p.cohort_code,
              item_code: p.item_code,
            },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await this.orderDetailModel.bulkWrite(bulkOps, { session });
      }

      const updatedDetails = await this.orderDetailModel
        .find({ order_id: orderId })
        .session(session);

      const total_money = updatedDetails.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      const order = await this.orderModel.findByIdAndUpdate(
        orderId,
        {
          ...updateData,
          total_money,
        },
        {
          new: true,
          session,
        },
      );

      // Course Activation Logic
      if (
        order &&
        order.process_status === EProcessStatus.Delivered &&
        order.payment_status === EPaymentStatus.Paid
      ) {
        const userId = order.user_id;
        if (userId) {
          const coursesMapping = updatedDetails
            .filter((item) => Boolean(item.product_id))
            .map((item) => ({
              course_id: item.product_id,
              cohort_code: item.cohort_code,
            }));

          // Only trigger mapping if there are courses to map
          if (coursesMapping.length > 0) {
            await this.studentsService.mapCourses(
              userId,
              coursesMapping as any,
              session,
            );
          }
        }
      }

      await session.commitTransaction();
      return order;
    } catch (error) {
      this.logger.error(error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateOrderStatus(orderId: string, status: EPaymentStatus) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel
        .findById(orderId)
        .populate('order_details')
        .session(session)
        .lean();

      if (!order) {
        throw new NotFoundException('Đơn hàng không tồn tại');
      }

      const userId = order.user_id;

      if (
        status === EPaymentStatus.Paid &&
        order.process_status === EProcessStatus.Delivered &&
        userId
      ) {
        const coursesMapping = order.order_details
          .filter((item) => Boolean(item.product_id))
          .map((item) => ({
            course_id: item.product_id,
            cohort_code: item.cohort_code,
          }));

        if (coursesMapping.length > 0) {
          await this.studentsService.mapCourses(
            userId,
            coursesMapping as any,
            session,
          );
        }
      }

      const updatedOrder = await this.orderModel.findByIdAndUpdate(
        orderId,
        {
          payment_status: status,
          payment_time: status === EPaymentStatus.Paid ? new Date() : undefined,
        },
        { new: true, session },
      );
      await session.commitTransaction();
      return updatedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
