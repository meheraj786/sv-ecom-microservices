import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller()
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post('order')
  createOrder(@Body() dto: { userId: string }) {
    return this.orderService.createOrder(dto.userId);
  }

  @Get('order')
  getOrders(
    @Query('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.orderService.getOrders(userId, query);
  }
}
