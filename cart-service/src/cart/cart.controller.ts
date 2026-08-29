import {
  BadRequestException,
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
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Query('userId') userId: string) {
    const items = await this.cartService.getCart(userId);
    return { items };
  }

  @Post('add')
  async addToCart(
    @Body() dto: AddToCartDto,
    @Query('userId') queryUserId?: string,
  ) {
    const userId = dto.userId || queryUserId;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const items = await this.cartService.addToCart(userId, dto);
    return { items };
  }

  @Put('update-quantity')
  async updateQuantity(
    @Body() dto: UpdateCartQuantityDto,
    @Query('userId') queryUserId?: string,
  ) {
    const userId = dto.userId || queryUserId;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const items = await this.cartService.updateQuantity(userId, dto);
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
  async clearCart(
    @Body('userId') bodyUserId?: string,
    @Query('userId') queryUserId?: string,
  ) {
    const userId = bodyUserId || queryUserId;
    return this.cartService.clearCart(userId as string);
  }
}
