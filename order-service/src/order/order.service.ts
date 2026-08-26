import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Prisma } from 'src/generated/prisma/client';

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  baseImage?: string;
  categories?: { categoryId: string }[];
  variants?: {
    id: string;
    sku: string;
    images: string[];
    productVariantValues: {
      optionValue: {
        value: string;
        option: {
          name: string;
        };
      };
    }[];
  }[];
}

interface FifoPriceResponse {
  variantId: string;
  totalPrice: number;
  unitPriceAverage: number;
  isAvailable: boolean;
  availableStock: number;
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
    private readonly prisma: PrismaService,
    @Inject('USER_RMQ_SERVICE') private readonly userRmqClient: ClientProxy,
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
      throw new BadRequestException(
        `Service request failed: ${method} ${url.pathname} (${response.status}) ${text}`,
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
  ): number {
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
    if (!productIds.length) return [];
    return this.httpRequest<
      { id: string; categories: { categoryId: string }[] }[]
    >(this.productBaseUrl, '/product/coupon-eligibility', 'POST', {
      productIds,
    });
  }

  private async validateCouponUsage(
    couponId: string,
    userId: string,
    perUserLimit?: number | null,
  ) {
    if (!perUserLimit || !userId || userId === 'GUEST') return;

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
    userId: string | undefined,
    cartItems: { productId: string; quantity: number; price: number }[],
    subtotal: number,
  ) {
    const normalizedCode = code.trim().toUpperCase();

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
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

    if (userId) {
      await this.validateCouponUsage(coupon.id, userId, coupon.perUserLimit);
    }

    if (subtotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required for this coupon`,
      );
    }

    const productIds = Array.from(
      new Set(cartItems.map((item) => item.productId)),
    );
    const products = await this.getProductEligibility(productIds);

    const couponProductIds = new Set(coupon.products.map((p) => p.productId));
    const couponCategoryIds = new Set(
      coupon.categories.map((c) => c.categoryId),
    );

    const eligibleProductIds = new Set<string>();

    if (coupon.scope === 'ALL') {
      for (const product of products) {
        eligibleProductIds.add(product.id);
      }
    } else if (coupon.scope === 'PRODUCTS') {
      for (const product of products) {
        if (couponProductIds.has(product.id)) {
          eligibleProductIds.add(product.id);
        }
      }
    } else if (coupon.scope === 'CATEGORIES') {
      for (const product of products) {
        const isEligible = product.categories?.some((cat) =>
          couponCategoryIds.has(cat.categoryId),
        );
        if (isEligible) {
          eligibleProductIds.add(product.id);
        }
      }
    }

    const eligibleSubtotal = cartItems.reduce((total, item) => {
      if (!eligibleProductIds.has(item.productId)) return total;
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
      couponId: coupon.id,
      code: coupon.code,
      isValid: true,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      eligibleSubtotal,
    };
  }

  async createOrder(userId: string | undefined, dto: CreateOrderDto) {
    const effectiveUserId = userId || dto.customerId || 'GUEST';

    const division = await this.prisma.division.findUnique({
      where: { id: dto.divisionId },
    });

    if (!division) {
      throw new NotFoundException('Selected division does not exist');
    }

    let cartItems: {
      productId: string;
      variantId: string;
      quantity: number;
    }[] = [];

    if (dto.items && dto.items.length > 0) {
      cartItems = dto.items;
    } else {
      const cartResponse = await this.httpRequest<{ items: CartItem[] }>(
        this.cartBaseUrl,
        `/cart?userId=${encodeURIComponent(effectiveUserId)}`,
        'GET',
      );
      cartItems = cartResponse?.items || [];
    }

    if (!cartItems.length) {
      throw new BadRequestException('Cannot place an order with an empty cart');
    }

    const uniqueProductIds = Array.from(
      new Set(cartItems.map((i) => i.productId)),
    );
    const productDetailsMap = new Map<string, ProductDetails>();

    await Promise.all(
      uniqueProductIds.map(async (pId) => {
        try {
          const product = await this.httpRequest<ProductDetails>(
            this.productBaseUrl,
            `/product/id/${pId}`,
            'GET',
          );
          productDetailsMap.set(pId, product);
        } catch {
          throw new BadRequestException(`Product with ID ${pId} not found`);
        }
      }),
    );

    let itemsSubtotal = 0;
    const orderItemsToCreate: {
      productId: string;
      variantId: string;
      quantity: number;
      price: number;
      variantSnapshot: Prisma.InputJsonValue;
    }[] = [];

    for (const item of cartItems) {
      const fifoCheck = await this.httpRequest<FifoPriceResponse>(
        this.inventoryBaseUrl,
        '/inventory/fifo-price',
        'POST',
        {
          variantId: item.variantId,
          quantity: item.quantity,
        },
      );

      if (!fifoCheck.isAvailable) {
        throw new BadRequestException(
          `Stock insufficient for requested items (variant: ${item.variantId})`,
        );
      }

      const unitPrice = fifoCheck.totalPrice / item.quantity;
      itemsSubtotal += fifoCheck.totalPrice;

      const product = productDetailsMap.get(item.productId);
      const variant = product?.variants?.find((v) => v.id === item.variantId);

      const optionsSnapshot: Record<string, string> = {};
      if (variant?.productVariantValues) {
        for (const pvv of variant.productVariantValues) {
          optionsSnapshot[pvv.optionValue.option.name] = pvv.optionValue.value;
        }
      }

      const variantSnapshot: Prisma.InputJsonValue = {
        productName: product?.name ?? 'Unknown Product',
        productSlug: product?.slug ?? '',
        sku: variant?.sku ?? product?.sku ?? '',
        image: variant?.images?.[0] ?? product?.baseImage ?? null,
        options: optionsSnapshot,
      };

      orderItemsToCreate.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: unitPrice,
        variantSnapshot,
      });
    }

    await this.httpRequest(
      this.inventoryBaseUrl,
      '/inventory/deduct-fifo',
      'POST',
      {
        items: orderItemsToCreate.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      },
    );

    let discountAmount = 0;
    let couponId: string | null = null;
    let normalizedCouponCode: string | null = null;

    if (dto.couponCode) {
      const couponValidation = await this.validateCoupon(
        dto.couponCode,
        effectiveUserId,
        orderItemsToCreate,
        itemsSubtotal,
      );

      discountAmount = couponValidation.discountAmount;
      couponId = couponValidation.couponId;
      normalizedCouponCode = couponValidation.code;
    }

    const totalAmount = new Prisma.Decimal(
      Math.max(
        0,
        Number(
          (itemsSubtotal - discountAmount + division.deliveryCharge).toFixed(2),
        ),
      ),
    );

    const order = await this.prisma.$transaction(async (tx) => {
      if (couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: couponId },
        });

        if (!coupon || !coupon.isActive) {
          throw new BadRequestException('Coupon is no longer valid');
        }

        if (
          coupon.usageLimit !== null &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          throw new BadRequestException('Coupon usage limit reached');
        }

        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: userId ?? null,
          customerId: effectiveUserId,
          customerName: dto.billing.fullName.trim(),
          customerEmail: dto.billing.email.trim().toLowerCase(),
          customerPhone: dto.billing.phone.trim(),
          shippingAddress: dto.billing.address.trim(),
          city: dto.billing.city.trim(),
          zipCode: dto.billing.zipCode?.trim() || null,
          divisionId: dto.divisionId,
          totalAmount,
          discountAmount,
          couponCode: normalizedCouponCode,
          couponId,
          status: 'PENDING',
          items: {
            create: orderItemsToCreate.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              variantSnapshot: item.variantSnapshot,
            })),
          },
        },
        include: {
          items: true,
          division: true,
          coupon: true,
        },
      });

      if (couponId && userId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            userId,
            orderId: createdOrder.id,
          },
        });
      }

      return createdOrder;
    });

    this.userRmqClient.emit('order_created', {
      orderId: order.id,
      userId: userId || null,
      billing: dto.billing,
    });

    try {
      await this.httpRequest(this.cartBaseUrl, '/cart', 'DELETE', {
        userId: effectiveUserId,
      });
    } catch {}

    return order;
  }

  async getOrders(userId: string | undefined, query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = userId
      ? { OR: [{ userId }, { customerId: userId }] }
      : {};

    const [totalOrders, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          division: true,
          coupon: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
      orders,
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        division: true,
        coupon: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async createCoupon(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    const scope = dto.scope ?? 'ALL';
    const productIds =
      scope === 'PRODUCTS' ? Array.from(new Set(dto.productIds || [])) : [];
    const categoryIds =
      scope === 'CATEGORIES' ? Array.from(new Set(dto.categoryIds || [])) : [];

    if (scope === 'PRODUCTS' && !productIds.length) {
      throw new BadRequestException(
        'At least one productId is required for PRODUCTS scope',
      );
    }

    if (scope === 'CATEGORIES' && !categoryIds.length) {
      throw new BadRequestException(
        'At least one categoryId is required for CATEGORIES scope',
      );
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const expiresAt = new Date(dto.expiresAt);

    if (startsAt && startsAt >= expiresAt) {
      throw new BadRequestException(
        'Start date must be earlier than expiry date',
      );
    }

    return this.prisma.coupon.create({
      data: {
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderValue: dto.minOrderValue ?? 0,
        maxDiscount: dto.maxDiscount ?? null,
        startsAt,
        expiresAt,
        usageLimit: dto.usageLimit ?? null,
        perUserLimit: dto.perUserLimit ?? null,
        scope,
        isActive: dto.isActive ?? true,
        products: {
          create: productIds.map((productId) => ({ productId })),
        },
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: {
        products: true,
        categories: true,
      },
    });
  }

  async getCoupons(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [totalCoupons, coupons] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        include: {
          products: true,
          categories: true,
          _count: { select: { usages: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        totalCoupons,
        page,
        limit,
        totalPages: Math.ceil(totalCoupons / limit),
      },
      coupons,
    };
  }

  async getCouponById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        products: true,
        categories: true,
        _count: { select: { usages: true, orders: true } },
      },
    });

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

    const code = dto.code ? dto.code.trim().toUpperCase() : undefined;
    if (code && code !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({ where: { code } });
      if (existing) {
        throw new BadRequestException('Coupon code already exists');
      }
    }

    const startsAt =
      dto.startsAt !== undefined
        ? dto.startsAt
          ? new Date(dto.startsAt)
          : null
        : coupon.startsAt;
    const expiresAt =
      dto.expiresAt !== undefined ? new Date(dto.expiresAt) : coupon.expiresAt;

    if (startsAt && expiresAt && startsAt >= expiresAt) {
      throw new BadRequestException(
        'Start date must be earlier than expiry date',
      );
    }

    const scope = dto.scope ?? coupon.scope;
    const productIds =
      scope === 'PRODUCTS' ? Array.from(new Set(dto.productIds || [])) : [];
    const categoryIds =
      scope === 'CATEGORIES' ? Array.from(new Set(dto.categoryIds || [])) : [];

    return this.prisma.$transaction(async (tx) => {
      const updatedCoupon = await tx.coupon.update({
        where: { id },
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
        await tx.couponProduct.deleteMany({ where: { couponId: id } });
        if (scope === 'PRODUCTS') {
          await tx.couponProduct.createMany({
            data: productIds.map((productId) => ({ couponId: id, productId })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.scope !== undefined || dto.categoryIds !== undefined) {
        await tx.couponCategory.deleteMany({ where: { couponId: id } });
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
        where: { id: updatedCoupon.id },
        include: {
          products: true,
          categories: true,
        },
      });
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

  async validateCouponForUser(
    userId: string,
    code: string,
    providedItems?: {
      productId: string;
      variantId: string;
      quantity: number;
      price?: number;
    }[],
  ) {
    let cartItems: {
      productId: string;
      variantId: string;
      quantity: number;
    }[] = [];

    if (providedItems && providedItems.length > 0) {
      cartItems = providedItems;
    } else {
      const cartResponse = await this.httpRequest<{ items: CartItem[] }>(
        this.cartBaseUrl,
        `/cart?userId=${encodeURIComponent(userId)}`,
        'GET',
      );
      cartItems = cartResponse?.items || [];
    }

    if (!cartItems.length) {
      throw new BadRequestException('Your cart is empty');
    }

    let subtotal = 0;
    const itemsWithPrice: {
      productId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of cartItems) {
      const fifoCheck = await this.httpRequest<FifoPriceResponse>(
        this.inventoryBaseUrl,
        '/inventory/fifo-price',
        'POST',
        {
          variantId: item.variantId,
          quantity: item.quantity,
        },
      );

      if (!fifoCheck.isAvailable) {
        throw new BadRequestException(`Variant ${item.variantId} out of stock`);
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
      code: validation.code,
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
