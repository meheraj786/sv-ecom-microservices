import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { ReviewModule } from './review/review.module'; // <--- Import ReviewModule

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductModule,
    ReviewModule,
  ],
})
export class AppModule {}
