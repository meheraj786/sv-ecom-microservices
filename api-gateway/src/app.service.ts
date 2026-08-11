import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Define gRPC service interfaces
interface UserGrpcService {
  registerUser(data: any): any;
  loginUser(data: any): any;
  registerVendor(data: any): any;
  loginVendor(data: any): any;
  getSettings(data: any): any;
  updateSettings(data: any): any;
}

interface ProductGrpcService {
  createCategory(data: any): any;
  getCategories(data: any): any;
  createSubCategory(data: any): any;
  getSubCategories(data: any): any;
  createProduct(data: any): any;
  getProducts(data: any): any;
  getProductBySlug(data: any): any;
}

interface CartGrpcService {
  getCart(data: any): any;
  addToCart(data: any): any;
  removeFromCart(data: any): any;
  clearCart(data: any): any;
}

interface OrderGrpcService {
  createOrder(data: any): any;
  getOrders(data: any): any;
}

@Injectable()
export class AppService implements OnModuleInit {
  public userService: UserGrpcService;
  public productService: ProductGrpcService;
  public cartService: CartGrpcService;
  public orderService: OrderGrpcService;

  constructor(
    @Inject('USER_PACKAGE') private userClient: ClientGrpc,
    @Inject('PRODUCT_PACKAGE') private productClient: ClientGrpc,
    @Inject('CART_PACKAGE') private cartClient: ClientGrpc,
    @Inject('ORDER_PACKAGE') private orderClient: ClientGrpc,
  ) {}

  onModuleInit() {
    // Bind services on startup
    this.userService =
      this.userClient.getService<UserGrpcService>('UserService');
    this.productService =
      this.productClient.getService<ProductGrpcService>('ProductGrpcService');
    this.cartService =
      this.cartClient.getService<CartGrpcService>('CartGrpcService');
    this.orderService =
      this.orderClient.getService<OrderGrpcService>('OrderGrpcService');
  }

  // --- HELPER TO CONVERT OBSERVALBES TO PROMISES cleanly ---
  async rpcCall<T>(observable: any): Promise<T> {
    return firstValueFrom(observable);
  }
}
