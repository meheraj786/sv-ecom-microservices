import { Injectable, BadRequestException } from '@nestjs/common';
import { AddBatchDto } from './dto/add-batch.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // 1. Add fresh inventory procurement batch
  async addBatch(dto: AddBatchDto) {
    // Use variant-based Stock model
    const existing = dto.batchNumber
      ? await this.prisma.stock.findFirst({ where: { batchNumber: dto.batchNumber } })
      : null;

    if (existing) {
      throw new BadRequestException('Batch number already exists');
    }

    return this.prisma.stock.create({
      data: {
        variantId: dto.variantId,
        batchNumber: dto.batchNumber,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        quantityReceived: dto.quantityReceived,
        quantityRemaining: dto.quantityReceived,
      },
    });
  }

  // 2. FIFO algorithm: Calculate total selling price (gRPC Sync request)
  async calculateFifoPrice(productId: string, quantity: number) {
    const batches = await this.prisma.stock.findMany({
      where: { variantId: productId, quantityRemaining: { gt: 0 } },
      orderBy: { createdAt: 'asc' }, // FIFO Order
    });

    let totalStockAvailable = 0;
    for (const b of batches) {
      totalStockAvailable += b.quantityRemaining;
    }

    if (totalStockAvailable < quantity) {
      return { totalPrice: 0, isAvailable: false };
    }

    let remainingToCalculate = quantity;
    let totalPrice = 0;

    for (const batch of batches) {
      if (remainingToCalculate <= 0) break;

      const takeFromThisBatch = Math.min(
        batch.quantityRemaining,
        remainingToCalculate,
      );
      totalPrice += takeFromThisBatch * batch.sellingPrice;
      remainingToCalculate -= takeFromThisBatch;
    }

    return { totalPrice, isAvailable: true };
  }

  // 3. FIFO actual stock reduction (Asynchronously called via RMQ)
  async deductFifoStock(productId: string, quantity: number) {
    const batches = await this.prisma.stock.findMany({
      where: { variantId: productId, quantityRemaining: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });

    let remainingToDeduct = quantity;

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      const deductFromThisBatch = Math.min(
        batch.quantityRemaining,
        remainingToDeduct,
      );

      await this.prisma.stock.update({
        where: { id: batch.id },
        data: {
          quantityRemaining: batch.quantityRemaining - deductFromThisBatch,
        },
      });

      remainingToDeduct -= deductFromThisBatch;
    }

    console.log(
      `Asynchronously deducted ${quantity} units from Product ${productId} using FIFO.`,
    );
  }
}
