import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string | undefined, dto: CreateOrderDto) {
    const { divisionId, couponCode, billing, items = [] } = dto;

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
        customerId: userId || 'GUEST',
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

  async getOrders(userId: string | undefined, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) {
      where.customerId = userId;
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

  async validateCouponForUser(userId: string, code: string, items?: any[]) {
    const cleanCode = code.toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or expired coupon code');
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Coupon is not active yet');
    }
    if (now > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }

    let subtotal = 0;
    if (items && items.length > 0) {
      subtotal = items.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 1),
        0,
      );
    }

    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value for this coupon is ৳${coupon.minOrderValue}`,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return {
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
    };
  }

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    const createData: any = {
      code: dto.code.toUpperCase(),
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderValue: dto.minOrderValue,
      maxDiscount: dto.maxDiscount,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      expiresAt: new Date(dto.expiresAt),
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit,
      scope: dto.scope,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    };

    if (dto.productIds && dto.productIds.length > 0) {
      createData.products = {
        create: dto.productIds.map((productId: string) => ({ productId })),
      };
    }

    if (dto.categoryIds && dto.categoryIds.length > 0) {
      createData.categories = {
        create: dto.categoryIds.map((categoryId: string) => ({ categoryId })),
      };
    }

    return this.prisma.coupon.create({
      data: createData,
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
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const updateData: any = {
      ...(dto.code ? { code: dto.code.toUpperCase() } : {}),
      ...(dto.discountType ? { discountType: dto.discountType } : {}),
      ...(dto.discountValue !== undefined
        ? { discountValue: dto.discountValue }
        : {}),
      ...(dto.minOrderValue !== undefined
        ? { minOrderValue: dto.minOrderValue }
        : {}),
      ...(dto.maxDiscount !== undefined
        ? { maxDiscount: dto.maxDiscount }
        : {}),
      ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
      ...(dto.expiresAt ? { expiresAt: new Date(dto.expiresAt) } : {}),
      ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
      ...(dto.perUserLimit !== undefined
        ? { perUserLimit: dto.perUserLimit }
        : {}),
      ...(dto.scope ? { scope: dto.scope } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    if (dto.productIds !== undefined) {
      updateData.products = {
        deleteMany: {},
        create: dto.productIds.map((productId: string) => ({ productId })),
      };
    }

    if (dto.categoryIds !== undefined) {
      updateData.categories = {
        deleteMany: {},
        create: dto.categoryIds.map((categoryId: string) => ({ categoryId })),
      };
    }

    return this.prisma.coupon.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    return { message: 'Coupon deleted successfully' };
  }
}
