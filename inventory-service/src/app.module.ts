import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { InventoryModule } from './inventory/inventory.module.js';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, InventoryModule],
})
export class AppModule {}
