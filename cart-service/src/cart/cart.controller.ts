import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller()
export class CartController {
  constructor(private cartService: CartService) {}

  @Get('cart')
  async getCart(@Query('userId') userId: string) {
    const items = await this.cartService.getCart(userId);
    return { items };
  }

  @Post('cart/add')
  async addToCart(@Body() dto: AddToCartDto & { userId: string }) {
    const { userId, ...addToCartDto } = dto;
    const items = await this.cartService.addToCart(userId, addToCartDto);
    return { items };
  }

  @Delete('cart/:variantId')
  async removeFromCart(
    @Param('variantId') variantId: string,
    @Body('userId') userId: string,
  ) {
    const items = await this.cartService.removeFromCart(userId, variantId);
    return { items };
  }

  @Delete('cart')
  clearCart(@Body('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
