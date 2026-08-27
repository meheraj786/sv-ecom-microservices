import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Query('userId') userId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(userId || undefined, dto);
  }

  @Get()
  getOrders(
    @Query('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.orderService.getOrders(userId || undefined, query);
  }

  @Get('single/:id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Put(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.orderService.updateOrderStatus(id, status);
  }

  @Post('coupon/validate')
  validateCoupon(
    @Query('userId') userId: string,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.orderService.validateCouponForUser(userId, dto.code, dto.items);
  }

  @Post('coupon')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.orderService.createCoupon(dto);
  }

  @Get('coupon')
  getCoupons(@Query() query: PaginationQueryDto) {
    return this.orderService.getCoupons(query);
  }

  @Get('coupon/:id')
  getCouponById(@Param('id') id: string) {
    return this.orderService.getCouponById(id);
  }

  @Put('coupon/:id')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.orderService.updateCoupon(id, dto);
  }

  @Delete('coupon/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.orderService.deleteCoupon(id);
  }
}
