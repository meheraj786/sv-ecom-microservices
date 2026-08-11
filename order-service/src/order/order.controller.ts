import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller()
export class OrderController {
  constructor(private orderService: OrderService) {}

  // 1. Create Order (gRPC Write)
  @GrpcMethod('OrderGrpcService', 'CreateOrder')
  createOrder(dto: { userId: string }) {
    return this.orderService.createOrder(dto.userId);
  }

  // 2. Get Orders (gRPC Read)
  @GrpcMethod('OrderGrpcService', 'GetOrders')
  getOrders(dto: PaginationQueryDto & { userId: string }) {
    const { userId, ...query } = dto;
    return this.orderService.getOrders(userId, query);
  }
}
