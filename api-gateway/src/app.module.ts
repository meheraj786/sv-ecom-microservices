import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 1. Load config env globally
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Global JWT Module setup
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY || 'secure_dynamic_secret_tokens_key',
      signOptions: { expiresIn: '24h' },
    }),

    ClientsModule.register([
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(__dirname, '../../shared/proto/user.proto'),
          url: 'localhost:50051',
        },
      },
      {
        name: 'PRODUCT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'product',
          protoPath: join(__dirname, '../../shared/proto/product.proto'),
          url: 'localhost:50052',
        },
      },
      {
        name: 'CART_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'cart',
          protoPath: join(__dirname, '../../shared/proto/cart.proto'),
          url: 'localhost:50053',
        },
      },
      {
        name: 'ORDER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'order',
          protoPath: join(__dirname, '../../shared/proto/order.proto'),
          url: 'localhost:50055',
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
