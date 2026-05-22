import { Injectable } from '@nestjs/common';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { PrismaService } from '../../prisma.service.js';
import {
  ApiResponse,
  SuccessResponseHandler,
} from '../../common/handlers/success-response.handler.js';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { ProductsService } from '../products/products.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { CreateSelectedOrderDto } from './dto/create-selected-order.dto.js';
import { Request } from 'express';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductsService,
  ) {}

  //create order
  async createOrder(userId: string, dto: CreateOrderDto): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      //get users cart with items
      const cartItems = await this.prisma.cart.findMany({
        where: { userId },
        include: {
          product: true,
        },
      });

      if (cartItems.length === 0) {
        throw ErrorHandler.invalidCredentials('Your Cart is empty');
      }

      //validate stock
      for (const item of cartItems) {
        const productSize = await this.prisma.productSize.findUnique({
          where: {
            productId_size: {
              productId: item.productId,
              size: item.size,
            },
          },
        });

        if (!productSize || productSize.stockQuantity < item.quantity) {
          throw ErrorHandler.notFound('items');
        }
      }

      // Calculate total
      const totalPrice = cartItems.reduce((sum, item) => {
        const price = item.product.dicountPrice ?? item.product.originalPrice;
        return sum + price * item.quantity;
      }, 0);


      //map payment mehtod string -> enum
const methodMap: Record<string, PaymentMethod> = {
  esewa:  PaymentMethod.Esewa,
  khalti: PaymentMethod.Khalti,
  cash:   PaymentMethod.Cash,
}
const paymentMethod = methodMap[dto.paymentMethod] ?? PaymentMethod.Cash

      //transaction create order, decrement stock , clear cart
      const order = await this.prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId,
            fullName: dto.fullName,
             phone: dto.phone,
             location: dto.location,
              paymentMethod,
             isPaid: false,
             paidAt: new Date(Date.now()),
            status: 'Pending',
            totalPrice,
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                name: item.product.name,
                image: item.product.images?.[0] ?? '',
                size: item.size,
                unitPrice:
                  item.product.dicountPrice ?? item.product.originalPrice,
                quantity: item.quantity,
                totalPrice:
                  (item.product.dicountPrice ?? item.product.originalPrice) *
                  item.quantity,
              })),
            },
          },
          include: { items: true },
        });
        //decrement stock
        for (const item of cartItems) {
          await tx.productSize.update({
            where: {
              productId_size: {
                productId: item.productId,
                size: item.size,
              },
            },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
        // ✅ Add this — recalculate isAvilable for each affected product
        const affectedProductIds = [
          ...new Set(cartItems.map((i) => i.productId)),
        ];

        for (const productId of affectedProductIds) {
          const sizes = await tx.productSize.findMany({ where: { productId } });
          const totalStock = sizes.reduce((sum, s) => sum + s.stockQuantity, 0);
          await tx.product.update({
            where: { id: productId },
            data: { isAvilable: totalStock > 0 },
          });
        }

        //clear cart
        await tx.cart.deleteMany({ where: { userId } });

        return newOrder;
      });

      return SuccessResponseHandler.created('order', order);
    }, 'OrderService.createOrder');
  }


  // order only the selected cart items (1 or more checked in the cart UI)
  async createSelectedItemsOrder(userId: string, dto: CreateSelectedOrderDto): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      console.log('[createSelectedItemsOrder] userId:', userId, '| cartItemIds:', dto.cartItemIds);
      const cartItems = await this.prisma.cart.findMany({
        where: { userId, id: { in: dto.cartItemIds } },
        include: { product: true },
      });
      console.log('[createSelectedItemsOrder] found cartItems:', cartItems.length);

      if (cartItems.length === 0) {
        throw ErrorHandler.invalidCredentials('No valid cart items found');
      }

      // validate stock for each selected item
      for (const item of cartItems) {
        const productSize = await this.prisma.productSize.findUnique({
          where: {
            productId_size: { productId: item.productId, size: item.size },
          },
        });
        if (!productSize || productSize.stockQuantity < item.quantity) {
          throw ErrorHandler.invalidCredentials(
            `Insufficient stock for ${item.product.name} (${item.size})`,
          );
        }
      }

      const totalPrice = cartItems.reduce((sum, item) => {
        const price = item.product.dicountPrice ?? item.product.originalPrice;
        return sum + price * item.quantity;
      }, 0);

      const methodMap: Record<string, PaymentMethod> = {
        esewa:  PaymentMethod.Esewa,
        khalti: PaymentMethod.Khalti,
        cash:   PaymentMethod.Cash,
      };
      const paymentMethod = methodMap[dto.paymentMethod] ?? PaymentMethod.Cash;

      const order = await this.prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId,
            fullName: dto.fullName,
            phone: dto.phone,
            location: dto.location,
            paymentMethod,
            isPaid: false,
            paidAt: new Date(),
            status: 'Pending',
            totalPrice,
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                name: item.product.name,
                image: item.product.images?.[0] ?? '',
                size: item.size,
                unitPrice: item.product.dicountPrice ?? item.product.originalPrice,
                quantity: item.quantity,
                totalPrice: (item.product.dicountPrice ?? item.product.originalPrice) * item.quantity,
              })),
            },
          },
          include: { items: true },
        });

        // decrement stock for each selected item
        for (const item of cartItems) {
          await tx.productSize.update({
            where: {
              productId_size: { productId: item.productId, size: item.size },
            },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        // recalculate isAvilable for affected products
        const affectedProductIds = [...new Set(cartItems.map((i) => i.productId))];
        for (const productId of affectedProductIds) {
          const sizes = await tx.productSize.findMany({ where: { productId } });
          const totalStock = sizes.reduce((sum, s) => sum + s.stockQuantity, 0);
          await tx.product.update({
            where: { id: productId },
            data: { isAvilable: totalStock > 0 },
          });
        }

        // remove only the selected cart items, not the whole cart
        await tx.cart.deleteMany({ where: { id: { in: dto.cartItemIds }, userId } });

        return newOrder;
      });

      return SuccessResponseHandler.created('order', order);
    }, 'OrderService.createSelectedItemsOrder');
  }

async getUserOrders(
  userId: string,
  tab: string = 'active',
  page: string = '1',
  limit: string = '4',
): Promise<ApiResponse<any>> {
  return ErrorHandler.execute(async () => {

    const take = parseInt(limit) || 4;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * take;

    let statusFilter: OrderStatus[] = [];
    if (tab === 'active')
      statusFilter = [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Shipped];
    else if (tab === 'past')
      statusFilter = [OrderStatus.Delivered, OrderStatus.Cancelled];
    else if (tab === 'returns')
      statusFilter = [OrderStatus.Returned];
    else
      statusFilter = [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Shipped];

    const where = {
      userId,
      ...(statusFilter.length > 0 && { status: { in: statusFilter } }),
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return SuccessResponseHandler.retrived(
      'orders',
      orders,
      {
        total,
        page: currentPage,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: currentPage < Math.ceil(total / take),
        hasPrev: currentPage > 1,
      },
    );

  }, 'OrderService.getUserOrders');
}

  async getAllOrders(
    tab: string = 'all',
    page: string = '1',
    limit: string = '10',
  ): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      const take = parseInt(limit) || 10;
      const currentPage = parseInt(page) || 1;
      const skip = (currentPage - 1) * take;

      const where: any = {};
      if (tab === 'active')
        where.status = { in: [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Shipped] };
      else if (tab === 'past')
        where.status = { in: [OrderStatus.Delivered, OrderStatus.Cancelled] };
      else if (tab === 'returns')
        where.status = { in: [OrderStatus.Returned] };

      const [total, orders] = await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.findMany({
          where,
          include: {
            items: true,
            user: { select: { id: true, username: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ]);

      return SuccessResponseHandler.retrived('orders', orders, {
        total,
        page: currentPage,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: currentPage < Math.ceil(total / take),
        hasPrev: currentPage > 1,
      });
    }, 'OrderService.getAllOrders');
  }

  //get a order  only admin
  async getOrderById(orderId: string, userId: string) {
    return ErrorHandler.execute(async () => {
      if (!userId) {
        throw ErrorHandler.unauthorized('User not authenticated');
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId, userId },
        include: { items: true },
      });
      console.log('order', order);

      if (!order) {
        throw ErrorHandler.notFound('Order');
      }

      return SuccessResponseHandler.retrived('order', order);
    }, 'OrderService.getOrderById');
  }

async updateOrderStatus(orderId: string, updateOrderDto: UpdateOrderDto) {
  return ErrorHandler.execute(async () => {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    })
    if (!order) throw ErrorHandler.notFound('Order')

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        // update status if provided
        ...(updateOrderDto.status && { status: updateOrderDto.status }),

        // update isPaid if provided
        ...(updateOrderDto.isPaid !== undefined && {
          isPaid: updateOrderDto.isPaid,
          paidAt: updateOrderDto.isPaid ? new Date() : null,
        }),
      },
    })

    return SuccessResponseHandler.updated('Order', updated)
  }, 'OrderService.updateOrderStatus')
}

  async bulkDeleteOrders(orderIds: string[]): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      if (!orderIds?.length) throw ErrorHandler.invalidCredentials('No order IDs provided');

      const { count } = await this.prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });

      return SuccessResponseHandler.deleted('orders', { deletedCount: count });
    }, 'OrderService.bulkDeleteOrders');
  }

  async cancelOrder(orderId: string, userId: string) {
    return ErrorHandler.execute(async () => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw ErrorHandler.notFound('Order');

      if (['Shipped', 'Delivered'].includes(order.status)) {
        throw ErrorHandler.serviceUnavailable(
          'Cannot cancel an order that has already been shipped or delivered.',
        );
      }

      //restock stock
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.productSize.updateMany({
            where: {
              productId: item.productId,
              size: item.size,
            },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
        // ✅ recalculate isAvilable after restoring stock
        const affectedProductIds = [
          ...new Set(order.items.map((i) => i.productId)),
        ];
        for (const productId of affectedProductIds) {
          const sizes = await tx.productSize.findMany({ where: { productId } });
          const totalStock = sizes.reduce((sum, s) => sum + s.stockQuantity, 0);
          await tx.product.update({
            where: { id: productId },
            data: { isAvilable: totalStock > 0 },
          });
        }

        //mark order cancelled
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.Cancelled },
        });
      });

      return SuccessResponseHandler.deleted('Order', order);
    }, 'OrderService.cancelOrder');
  }








  async getOrderStatsForUser(userId: string) {
  const orderGroups = await this.prisma.order.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  const countByStatus = Object.fromEntries(
    orderGroups.map((g) => [g.status, g._count.status])
  );

  const orderCounts = {
    active:  (countByStatus["Pending"]   ?? 0) +
             (countByStatus["Confirmed"] ?? 0) +
             (countByStatus["Shipped"]   ?? 0),
    past:    (countByStatus["Delivered"] ?? 0) +
             (countByStatus["Cancelled"] ?? 0),
    returns:  countByStatus["Returned"]  ?? 0,
  };

  // last order + total spent
  const orders = await this.prisma.order.findMany({
    where: { userId },
    select: { totalPrice: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

const totalSpent = orders
  .filter(o => o.status === "Delivered")
  .reduce((sum, o) => sum + parseFloat(o.totalPrice.toString()), 0);

  const lastOrder = orders[0];

  return {
    orderCounts,
    ordersCount:  orders.length,
    totalSpent:   `Rs. ${totalSpent.toLocaleString()}`,
    lastOrder:    lastOrder
      ? new Date(lastOrder.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "—",
  };
}
}


