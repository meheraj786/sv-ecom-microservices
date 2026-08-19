import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  createOrder(@Query('userId') userId: string, @Body() billing: any) {
    return this.orderService.createOrder(userId, billing);
  }

  @Get()
  getOrders(
    @Query('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.orderService.getOrders(userId, query);
  }
}
