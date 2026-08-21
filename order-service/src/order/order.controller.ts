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
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(
    @Query('userId') userId: string,
    @Query('couponCode') couponCode: string,
    @Body() billing: any,
  ) {
    return this.orderService.createOrder(
      userId,
      billing,
      couponCode || undefined,
    );
  }

  @Get()
  getOrders(
    @Query('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.orderService.getOrders(userId, query);
  }

  @Post('coupon/validate')
  validateCoupon(
    @Query('userId') userId: string,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.orderService.validateCouponForUser(userId, dto.code);
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
