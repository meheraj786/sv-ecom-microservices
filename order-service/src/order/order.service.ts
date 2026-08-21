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

interface ProductCategoryItem {
  categoryId: string;
}

interface ProductEligibility {
  id: string;
  categories: ProductCategoryItem[];
}

interface CouponValidationResult {
  isValid: boolean;
  discountAmount: number;
  discountType: string;
  discountValue: number;
  eligibleSubtotal: number;
}

@Injectable()
export class OrderService {
  private readonly cartBaseUrl =
    process.env.CART_SERVICE_URL ?? 'http://localhost:3003';

  private readonly inventoryBaseUrl =
    process.env.INVENTORY_SERVICE_URL ?? 'http://localhost:3004';

  private readonly productBaseUrl =
    process.env.PRODUCT_SERVICE_URL ?? 'http://localhost:3002';

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

  private calculateDiscount(
    discountType: string,
    discountValue: number,
    subtotal: number,
    maxDiscount?: number | null,
  ) {
    let discountAmount = 0;

    if (discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (discountValue / 100);

      if (maxDiscount !== null && maxDiscount !== undefined) {
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
    } else if (discountType === 'FIXED') {
      discountAmount = Math.min(discountValue, subtotal);
    } else {
      throw new BadRequestException('Invalid discount type');
    }

    return Math.max(0, Number(discountAmount.toFixed(2)));
  }

  private async getProductEligibility(productIds: string[]) {
    if (productIds.length === 0) {
      return [];
    }

    return this.httpRequest<ProductEligibility[]>(
      this.productBaseUrl,
      '/product/coupon-eligibility',
      'POST',
      {
        productIds,
      },
    );
  }

  private async validateCouponUsage(
    couponId: string,
    userId: string,
    perUserLimit?: number | null,
  ) {
    if (!perUserLimit) {
      return;
    }

    const usageCount = await this.prisma.couponUsage.count({
      where: {
        couponId,
        userId,
      },
    });

    if (usageCount >= perUserLimit) {
      throw new BadRequestException(
        'You have reached the usage limit for this coupon',
      );
    }
  }

  async validateCoupon(
    code: string,
    userId: string,
    cartItems: CartItem[],
    subtotal: number,
  ): Promise<CouponValidationResult> {
    const normalizedCode = code.trim().toUpperCase();

    const coupon = await this.prisma.coupon.findUnique({
      where: {
        code: normalizedCode,
      },
      include: {
        products: true,
        categories: true,
      },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Coupon is invalid or inactive');
    }

    const now = new Date();

    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('Coupon is not active yet');
    }

    if (coupon.expiresAt <= now) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    await this.validateCouponUsage(coupon.id, userId, coupon.perUserLimit);

    if (subtotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required to apply this coupon`,
      );
    }

    const productIds = cartItems.map((item) => item.productId);

    const products = await this.getProductEligibility(productIds);

    const couponProductIds = new Set(
      coupon.products.map((item) => item.productId),
    );

    const couponCategoryIds = new Set(
      coupon.categories.map((item) => item.categoryId),
    );

    const eligibleProductIds = new Set<string>();

    if (coupon.scope === 'ALL') {
      for (const product of products) {
        eligibleProductIds.add(product.id);
      }
    }

    if (coupon.scope === 'PRODUCTS') {
      for (const product of products) {
        if (couponProductIds.has(product.id)) {
          eligibleProductIds.add(product.id);
        }
      }
    }

    if (coupon.scope === 'CATEGORIES') {
      for (const product of products) {
        const isEligible = product.categories?.some((cat) =>
          couponCategoryIds.has(cat.categoryId),
        );

        if (isEligible) {
          eligibleProductIds.add(product.id);
        }
      }
    }

    if (
      coupon.scope !== 'ALL' &&
      coupon.scope !== 'PRODUCTS' &&
      coupon.scope !== 'CATEGORIES'
    ) {
      throw new BadRequestException('Invalid coupon scope');
    }

    const eligibleSubtotal = cartItems.reduce((total, item) => {
      if (!eligibleProductIds.has(item.productId)) {
        return total;
      }

      return total + item.price * item.quantity;
    }, 0);

    if (eligibleSubtotal <= 0) {
      throw new BadRequestException(
        'This coupon is not applicable to any product in your cart',
      );
    }

    const discountAmount = this.calculateDiscount(
      coupon.discountType,
      coupon.discountValue,
      eligibleSubtotal,
      coupon.maxDiscount,
    );

    return {
      isValid: true,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      eligibleSubtotal,
    };
  }

  async createOrder(userId: string, billing: BillingInfo, couponCode?: string) {
    const cartResponse = await this.httpRequest<{ items: CartItem[] }>(
      this.cartBaseUrl,
      `/cart?userId=${encodeURIComponent(userId)}`,
      'GET',
    );

    const cartItems = cartResponse.items || [];

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
    let normalizedCouponCode: string | null = null;
    let couponId: string | null = null;

    if (couponCode) {
      const validation = await this.validateCoupon(
        couponCode,
        userId,
        orderItemsToCreate,
        subtotal,
      );

      discountAmount = validation.discountAmount;
      normalizedCouponCode = couponCode.trim().toUpperCase();

      const coupon = await this.prisma.coupon.findUnique({
        where: {
          code: normalizedCouponCode,
        },
        select: {
          id: true,
        },
      });

      if (!coupon) {
        throw new BadRequestException('Coupon is no longer available');
      }

      couponId = coupon.id;
    }

    const totalAmount = Math.max(
      0,
      Number((subtotal - discountAmount).toFixed(2)),
    );

    const order = await this.prisma.$transaction(async (tx) => {
      if (couponId) {
        const coupon = await tx.coupon.findUnique({
          where: {
            id: couponId,
          },
        });

        if (!coupon || !coupon.isActive) {
          throw new BadRequestException('Coupon is no longer available');
        }

        const now = new Date();

        if (coupon.startsAt && coupon.startsAt > now) {
          throw new BadRequestException('Coupon is not active yet');
        }

        if (coupon.expiresAt <= now) {
          throw new BadRequestException('Coupon has expired');
        }

        if (
          coupon.usageLimit !== null &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          throw new BadRequestException('Coupon usage limit has been reached');
        }

        if (coupon.perUserLimit) {
          const userUsageCount = await tx.couponUsage.count({
            where: {
              couponId,
              userId,
            },
          });

          if (userUsageCount >= coupon.perUserLimit) {
            throw new BadRequestException(
              'You have reached the usage limit for this coupon',
            );
          }
        }

        await tx.coupon.update({
          where: {
            id: couponId,
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          discountAmount,
          couponCode: normalizedCouponCode,
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

      if (couponId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            userId,
            orderId: newOrder.id,
          },
        });
      }

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
      {
        userId,
      },
    );

    return {
      id: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      couponCode: order.couponCode,
      status: order.status,
      message: 'Order placed, stock reserved, and cart cleared successfully.',
    };
  }

  async getOrders(userId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({
        where: {
          userId,
        },
      }),
      this.prisma.order.findMany({
        where: {
          userId,
        },
        skip,
        take: limit,
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
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

  async createCoupon(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.coupon.findUnique({
      where: {
        code,
      },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    if (!['PERCENTAGE', 'FIXED'].includes(dto.discountType)) {
      throw new BadRequestException('Invalid discount type');
    }

    const scope = dto.scope ?? 'ALL';

    if (!['ALL', 'PRODUCTS', 'CATEGORIES'].includes(scope)) {
      throw new BadRequestException('Invalid coupon scope');
    }

    if (dto.discountValue <= 0) {
      throw new BadRequestException('Discount value must be greater than zero');
    }

    if (dto.discountType === 'PERCENTAGE' && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100');
    }

    if (dto.maxDiscount !== undefined && dto.maxDiscount !== null) {
      if (dto.maxDiscount <= 0) {
        throw new BadRequestException(
          'Maximum discount must be greater than zero',
        );
      }
    }

    const minOrderValue = dto.minOrderValue ?? 0;

    if (minOrderValue < 0) {
      throw new BadRequestException('Minimum order value cannot be negative');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const expiresAt = new Date(dto.expiresAt);

    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invalid expiry date');
    }

    if (startsAt && Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid start date');
    }

    if (startsAt && startsAt >= expiresAt) {
      throw new BadRequestException('Start date must be before expiry date');
    }

    const productIds =
      scope === 'PRODUCTS' ? [...new Set(dto.productIds || [])] : [];

    const categoryIds =
      scope === 'CATEGORIES' ? [...new Set(dto.categoryIds || [])] : [];

    if (scope === 'PRODUCTS' && productIds.length === 0) {
      throw new BadRequestException('At least one product is required');
    }

    if (scope === 'CATEGORIES' && categoryIds.length === 0) {
      throw new BadRequestException('At least one category is required');
    }

    return this.prisma.coupon.create({
      data: {
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderValue,
        maxDiscount: dto.maxDiscount ?? null,
        startsAt,
        expiresAt,
        usageLimit: dto.usageLimit ?? null,
        perUserLimit: dto.perUserLimit ?? null,
        scope,
        isActive: dto.isActive ?? true,

        products: {
          create: productIds.map((productId) => ({
            productId,
          })),
        },

        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },

      include: {
        products: true,
        categories: true,
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
        include: {
          products: true,
          categories: true,
          _count: {
            select: {
              usages: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
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
      where: {
        id,
      },
      include: {
        products: true,
        categories: true,
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        id,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const code = dto.code ? dto.code.trim().toUpperCase() : undefined;

    if (code && code !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: {
          code,
        },
      });

      if (existing) {
        throw new BadRequestException('Coupon code already exists');
      }
    }

    if (
      dto.discountType &&
      !['PERCENTAGE', 'FIXED'].includes(dto.discountType)
    ) {
      throw new BadRequestException('Invalid discount type');
    }

    if (dto.scope && !['ALL', 'PRODUCTS', 'CATEGORIES'].includes(dto.scope)) {
      throw new BadRequestException('Invalid coupon scope');
    }

    const startsAt =
      dto.startsAt !== undefined
        ? dto.startsAt
          ? new Date(dto.startsAt)
          : null
        : undefined;

    const expiresAt =
      dto.expiresAt !== undefined ? new Date(dto.expiresAt) : undefined;

    if (startsAt && expiresAt && startsAt >= expiresAt) {
      throw new BadRequestException('Start date must be before expiry date');
    }

    const scope = dto.scope ?? coupon.scope;

    const productIds =
      scope === 'PRODUCTS' ? [...new Set(dto.productIds || [])] : [];

    const categoryIds =
      scope === 'CATEGORIES' ? [...new Set(dto.categoryIds || [])] : [];

    if (
      scope === 'PRODUCTS' &&
      dto.productIds !== undefined &&
      productIds.length === 0
    ) {
      throw new BadRequestException('At least one product is required');
    }

    if (
      scope === 'CATEGORIES' &&
      dto.categoryIds !== undefined &&
      categoryIds.length === 0
    ) {
      throw new BadRequestException('At least one category is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedCoupon = await tx.coupon.update({
        where: {
          id,
        },
        data: {
          code,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          minOrderValue: dto.minOrderValue,
          maxDiscount:
            dto.maxDiscount !== undefined ? dto.maxDiscount : undefined,
          startsAt,
          expiresAt,
          usageLimit: dto.usageLimit,
          perUserLimit: dto.perUserLimit,
          scope: dto.scope,
          isActive: dto.isActive,
        },
      });

      if (dto.scope !== undefined || dto.productIds !== undefined) {
        await tx.couponProduct.deleteMany({
          where: {
            couponId: id,
          },
        });

        if (scope === 'PRODUCTS') {
          await tx.couponProduct.createMany({
            data: productIds.map((productId) => ({
              couponId: id,
              productId,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.scope !== undefined || dto.categoryIds !== undefined) {
        await tx.couponCategory.deleteMany({
          where: {
            couponId: id,
          },
        });

        if (scope === 'CATEGORIES') {
          await tx.couponCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              couponId: id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.coupon.findUnique({
        where: {
          id: updatedCoupon.id,
        },
        include: {
          products: true,
          categories: true,
        },
      });
    });
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        id,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Coupon deleted successfully',
    };
  }

  async validateCouponForUser(userId: string, code: string) {
    const cartResponse = await this.httpRequest<{ items: CartItem[] }>(
      this.cartBaseUrl,
      `/cart?userId=${encodeURIComponent(userId)}`,
      'GET',
    );

    const cartItems = cartResponse.items || [];

    if (cartItems.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    let subtotal = 0;

    const itemsWithPrice: CartItem[] = [];

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

      const itemPrice = fifoCheck.totalPrice / item.quantity;

      subtotal += fifoCheck.totalPrice;

      itemsWithPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    const validation = await this.validateCoupon(
      code,
      userId,
      itemsWithPrice,
      subtotal,
    );

    return {
      code: code.trim().toUpperCase(),
      subtotal,
      eligibleSubtotal: validation.eligibleSubtotal,
      discountAmount: validation.discountAmount,
      totalAmount: Math.max(
        0,
        Number((subtotal - validation.discountAmount).toFixed(2)),
      ),
      discountType: validation.discountType,
      discountValue: validation.discountValue,
      isValid: true,
    };
  }
}
