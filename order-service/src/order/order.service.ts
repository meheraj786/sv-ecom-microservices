import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: { userId?: string } & CreateOrderDto) {
    const { userId, divisionId, couponCode, billing, items = [] } = data;

    const division = await this.prisma.division.findUnique({
      where: { id: divisionId },
    });

    if (!division) {
      throw new BadRequestException('Invalid division selected');
    }

    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      subtotal += price * qty;

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: qty,
        price: price,
        variantSnapshot: {
          productName: item.name || 'Product Item',
          image: item.image || '',
          sku: item.sku || '',
          options: item.options || {},
        },
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const cleanCouponCode = couponCode.toUpperCase();
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: cleanCouponCode },
      });

      if (coupon && coupon.isActive) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const deliveryCharge = division.deliveryCharge;
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);

    const order = await this.prisma.order.create({
      data: {
        userId: userId || 'GUEST',
        divisionId,
        couponCode: couponCode ? couponCode.toUpperCase() : null,
        discountAmount,
        totalAmount,
        status: 'PENDING',
        customerName: billing.fullName,
        customerEmail: billing.email,
        customerPhone: billing.phone,
        shippingAddress: billing.address,
        city: billing.city,
        zipCode: billing.zipCode || null,
        country: billing.country || 'Bangladesh',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
        division: true,
      },
    });

    return order;
  }

  async getOrderById(searchId: string) {
    const cleanId = searchId
      .trim()
      .replace(/^#ORD-/i, '')
      .replace(/^#LX-/i, '');

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { id: { endsWith: cleanId.toLowerCase() } },
          { id: { endsWith: cleanId.toUpperCase() } },
          { id: { endsWith: cleanId } },
        ],
      },
      include: {
        division: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found with provided ID or Reference',
      );
    }

    return order;
  }

  async getOrders(params: { userId?: string } & PaginationQueryDto) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.userId) {
      where.userId = params.userId;
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          division: true,
        },
      }),
    ]);

    return {
      meta: {
        totalOrders: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      orders,
    };
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        division: true,
      },
    });
  }
}
