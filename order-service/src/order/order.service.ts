import { Injectable, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
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

  async createOrder(userId: string) {
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

    let totalAmount = 0;
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

      totalAmount += fifoCheck.totalPrice;
      orderItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        price: fifoCheck.totalPrice / item.quantity,
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
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
}
