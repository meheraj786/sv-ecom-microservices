import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices'; // <--- Import GrpcMethod
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller()
export class CartController {
  constructor(private cartService: CartService) {}

  @GrpcMethod('CartGrpcService', 'GetCart')
  async getCart(dto: { userId: string }) {
    const items = await this.cartService.getCart(dto.userId);
    return { items };
  }

  @GrpcMethod('CartGrpcService', 'AddToCart')
  async addToCart(dto: AddToCartDto & { userId: string }) {
    const { userId, ...addToCartDto } = dto;
    const items = await this.cartService.addToCart(userId, addToCartDto);
    return { items };
  }

  @GrpcMethod('CartGrpcService', 'RemoveFromCart')
  async removeFromCart(dto: { userId: string; productId: string }) {
    const items = await this.cartService.removeFromCart(
      dto.userId,
      dto.productId,
    );
    return { items };
  }

  @GrpcMethod('CartGrpcService', 'ClearCart')
  clearCart(dto: { userId: string }) {
    return this.cartService.clearCart(dto.userId);
  }
}
