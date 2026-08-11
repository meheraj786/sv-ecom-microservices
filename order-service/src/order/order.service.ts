import {
  Injectable,
  OnModuleInit,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices'; // <--- Type-only import to satisfy TS1272
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CartGrpcService {
  getCart(data: { userId: string }): any;
  clearCart(data: { userId: string }): any;
}

interface InventoryGrpcService {
  calculateFifoPrice(data: { productId: string; quantity: number }): any;
}

@Injectable()
export class OrderService implements OnModuleInit {
  private cartService: CartGrpcService;
  private inventoryService: InventoryGrpcService;

  constructor(
    private prisma: PrismaService,
    @Inject('CART_PACKAGE') private cartClient: ClientGrpc,
    @Inject('INVENTORY_PACKAGE') private inventoryClient: ClientGrpc,
    @Inject('RABBITMQ_SERVICE') private rmqClient: ClientProxy, // Inject RabbitMQ Publisher
  ) {}

  onModuleInit() {
    // Instantiate gRPC services on startup
    this.cartService =
      this.cartClient.getService<CartGrpcService>('CartGrpcService');
    this.inventoryService =
      this.inventoryClient.getService<InventoryGrpcService>(
        'InventoryGrpcService',
      );
  }

  // --- CORE CHECKOUT TRANSACTION ---
  async createOrder(userId: string) {
    // 1. Fetch user's cart items from Cart Service (via gRPC with explicit typing)
    const cartResponse = await firstValueFrom<{ items: CartItem[] }>(
      this.cartService.getCart({ userId }),
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

    // 2. Verify pricing & stock availability dynamically from Inventory Service (via gRPC with explicit typing)
    for (const item of cartItems) {
      const fifoCheck = await firstValueFrom<{
        totalPrice: number;
        isAvailable: boolean;
      }>(
        this.inventoryService.calculateFifoPrice({
          productId: item.productId,
          quantity: item.quantity,
        }),
      );

      if (!fifoCheck.isAvailable) {
        throw new BadRequestException(
          `Product ${item.productId} does not have enough stock available.`,
        );
      }

      totalAmount += fifoCheck.totalPrice;
      orderItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        price: fifoCheck.totalPrice / item.quantity, // Set average unit price dynamically
      });
    }

    // 3. Save Order and OrderItems to PostgreSQL inside a transactional block
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PAID', // In production, this shifts based on Payment gateway callbacks
        },
      });

      // Create child order items
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

    // 4. Publish 'order_created' asynchronous event to RabbitMQ
    // This triggers Inventory Service in background to deduct stock!
    this.rmqClient.emit('order_created', {
      orderId: order.id,
      userId,
      items: orderItemsToCreate.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    console.log(`RabbitMQ: Emitted order_created event for Order ${order.id}.`);

    // 5. Clear User's Cart in background (via gRPC with explicit typing)
    await firstValueFrom<{ message: string }>(
      this.cartService.clearCart({ userId }),
    );

    return {
      id: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: order.status,
      message: 'Order placed, stock reserved, and cart cleared successfully.',
    };
  }

  // --- FETCH PERSONAL ORDERS ---
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
