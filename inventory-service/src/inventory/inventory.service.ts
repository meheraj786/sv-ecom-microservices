import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddBatchDto } from './dto/add-batch.dto';
import { GetStocksQueryDto } from './dto/get-stocks-query.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async addBatch(dto: AddBatchDto) {
    if (dto.batchNumber) {
      const existing = await this.prisma.stock.findFirst({
        where: { batchNumber: dto.batchNumber },
      });
      if (existing) {
        throw new BadRequestException('Batch number already exists');
      }
    }

    return this.prisma.stock.create({
      data: {
        variantId: dto.variantId,
        batchNumber: dto.batchNumber || null,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        quantityReceived: dto.quantityReceived,
        quantityRemaining: dto.quantityReceived,
        note: dto.note || null,
      },
    });
  }

  async getStocks(query: GetStocksQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = query.variantId ? { variantId: query.variantId } : {};

    const [totalStocks, stocks] = await Promise.all([
      this.prisma.stock.count({ where }),
      this.prisma.stock.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        totalStocks,
        page,
        limit,
        totalPages: Math.ceil(totalStocks / limit),
      },
      stocks,
    };
  }

  async getVariantStockSummary(variantId: string) {
    const batches = await this.prisma.stock.findMany({
      where: { variantId, quantityRemaining: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });

    const totalStock = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    const currentSellingPrice =
      batches.length > 0 ? batches[0].sellingPrice : 0;

    return {
      variantId,
      totalStock,
      currentSellingPrice,
      activeBatchesCount: batches.length,
    };
  }

  async calculateFifoPrice(variantId: string, quantity: number) {
    const batches = await this.prisma.stock.findMany({
      where: { variantId, quantityRemaining: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });

    let totalStockAvailable = 0;
    for (const b of batches) {
      totalStockAvailable += b.quantityRemaining;
    }

    if (totalStockAvailable < quantity) {
      return {
        variantId,
        totalPrice: 0,
        unitPriceAverage: 0,
        isAvailable: false,
        availableStock: totalStockAvailable,
      };
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

    return {
      variantId,
      totalPrice,
      unitPriceAverage: totalPrice / quantity,
      isAvailable: true,
      availableStock: totalStockAvailable,
    };
  }

  async deductFifoStock(variantId: string, quantity: number) {
    const batches = await this.prisma.stock.findMany({
      where: { variantId, quantityRemaining: { gt: 0 } },
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

    return { success: true, deducted: quantity - remainingToDeduct };
  }
}
