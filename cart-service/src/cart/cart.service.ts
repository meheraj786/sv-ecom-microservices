import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { AddToCartDto, UpdateCartQuantityDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private redis: RedisService) {}

  private getCartKey(userId: string): string {
    return `cart:${userId}`;
  }

  async getCart(userId: string) {
    const cartData = await this.redis.client.get(this.getCartKey(userId));
    return cartData ? JSON.parse(cartData) : [];
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const key = this.getCartKey(userId);
    const cart = await this.getCart(userId);

    const existingItemIndex = cart.findIndex(
      (item: any) => item.variantId === dto.variantId,
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += dto.quantity;
      if (dto.price !== undefined) {
        cart[existingItemIndex].price = dto.price;
      }
    } else {
      cart.push(dto);
    }

    await this.redis.client.set(key, JSON.stringify(cart), 'EX', 604800);
    return cart;
  }

  async updateQuantity(userId: string, dto: UpdateCartQuantityDto) {
    const key = this.getCartKey(userId);
    const cart = await this.getCart(userId);

    const itemIndex = cart.findIndex(
      (item: any) => item.variantId === dto.variantId,
    );

    if (itemIndex > -1) {
      cart[itemIndex].quantity = dto.quantity;
      await this.redis.client.set(key, JSON.stringify(cart), 'EX', 604800);
    }

    return cart;
  }

  async removeFromCart(userId: string, variantId: string) {
    const key = this.getCartKey(userId);
    let cart = await this.getCart(userId);

    cart = cart.filter((item: any) => item.variantId !== variantId);

    await this.redis.client.set(key, JSON.stringify(cart), 'EX', 604800);
    return cart;
  }

  async clearCart(userId: string) {
    const key = this.getCartKey(userId);
    await this.redis.client.del(key);
    return { message: 'Cart cleared successfully' };
  }
}
