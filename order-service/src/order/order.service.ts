import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface BillingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

@Injectable()
export class OrderService {
  private readonly cartBaseUrl =
    process.env.CART_SERVICE_URL ?? 'http://localhost:3003';
  private readonly inventoryBaseUrl =
    process.env.INVENTORY_SERVICE_URL ?? 'http://localhost:3004';

  constructor(
    private prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private rmqClient: ClientProxy,
  ) {}

  private async httpRequest<T>(
    baseUrl: string,
    path: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: any,
  ): Promise<T> {
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body:
        body !== undefined && method !== 'GET'
          ? JSON.stringify(body)
          : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `HTTP ${method} ${url.toString()} failed with status ${response.status}: ${text}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Coupon is invalid or inactive');
    }

    const now = new Date();
    if (new Date(coupon.expiresAt) < now) {
      throw new BadRequestException('Coupon has expired');
    }

    if (subtotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of $${coupon.minOrderValue} required to apply this coupon`,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      isValid: true,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };
  }

  async createOrder(userId: string, billing: BillingInfo, couponCode?: string) {
    const cartResponse = await this.httpRequest<{ items: CartItem[] }>(
      this.cartBaseUrl,
      `/cart?userId=${encodeURIComponent(userId)}`,
      'GET',
    );
    const cartItems: CartItem[] = cartResponse.items || [];

    if (cartItems.length === 0) {
      throw new BadRequestException(
        'Cannot place an order with an empty cart.',
      );
    }

    let subtotal = 0;
    const orderItemsToCreate: {
      productId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of cartItems) {
      const fifoCheck = await this.httpRequest<{
        totalPrice: number;
        isAvailable: boolean;
      }>(this.inventoryBaseUrl, '/inventory/fifo-price', 'POST', {
        productId: item.productId,
        quantity: item.quantity,
      });

      if (!fifoCheck.isAvailable) {
        throw new BadRequestException(
          `Product ${item.productId} does not have enough stock available.`,
        );
      }

      subtotal += fifoCheck.totalPrice;
      orderItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        price: fifoCheck.totalPrice / item.quantity,
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const validation = await this.validateCoupon(couponCode, subtotal);
      discountAmount = validation.discountAmount;
    }

    const totalAmount = subtotal - discountAmount;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          discountAmount,
          couponCode: couponCode ? couponCode.toUpperCase() : null,
          status: 'PAID',
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsToCreate.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      return newOrder;
    });

    this.rmqClient.emit('order_created', {
      orderId: order.id,
      userId,
      billing,
      items: orderItemsToCreate.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    await this.httpRequest<{ message: string }>(
      this.cartBaseUrl,
      '/cart',
      'DELETE',
      { userId },
    );

    return {
      id: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      status: order.status,
      message: 'Order placed, stock reserved, and cart cleared successfully.',
    };
  }

  async getOrders(userId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
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

  // --- COUPON CRUD SERVICES ---

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async getCoupons(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, coupons] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        totalCoupons: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      coupons,
    };
  }

  async getCouponById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted successfully' };
  }
}
