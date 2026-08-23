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
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartQuantityDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Query('userId') userId: string) {
    const items = await this.cartService.getCart(userId);
    return { items };
  }

  @Post('add')
  async addToCart(@Body() dto: AddToCartDto & { userId: string }) {
    const { userId, ...addToCartDto } = dto;
    const items = await this.cartService.addToCart(userId, addToCartDto);
    return { items };
  }

  @Put('update-quantity')
  async updateQuantity(
    @Body() dto: UpdateCartQuantityDto & { userId: string },
  ) {
    const { userId, ...updateDto } = dto;
    const items = await this.cartService.updateQuantity(userId, updateDto);
    return { items };
  }

  @Delete(':variantId')
  async removeFromCart(
    @Param('variantId') variantId: string,
    @Query('userId') userId: string,
  ) {
    const items = await this.cartService.removeFromCart(userId, variantId);
    return { items };
  }

  @Delete()
  clearCart(@Body('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
