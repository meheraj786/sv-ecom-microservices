import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddBatchDto } from './dto/add-batch.dto';
import { GetStocksQueryDto } from './dto/get-stocks-query.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async addBatch(dto: AddBatchDto) {
    if (dto.batchNumber) {
      const existing = await this.prisma.stock.findFirst({
        where: {
          batchNumber: dto.batchNumber,
        },
      });

      if (existing) {
        throw new BadRequestException('Batch number already exists');
      }
    }

    if (
      dto.isDiscounted &&
      (dto.beforeDiscount === undefined ||
        dto.beforeDiscount <= dto.sellingPrice)
    ) {
      throw new BadRequestException(
        'beforeDiscount must be greater than sellingPrice when discounted',
      );
    }

    return this.prisma.stock.create({
      data: {
        variantId: dto.variantId,
        batchNumber: dto.batchNumber ?? null,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        quantityReceived: dto.quantityReceived,
        quantityRemaining: dto.quantityReceived,
        isDiscounted: dto.isDiscounted ?? false,
        beforeDiscount: dto.isDiscounted ? (dto.beforeDiscount ?? null) : null,
        note: dto.note ?? null,
      },
    });
  }

  async getStocks(query: GetStocksQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = query.variantId
      ? {
          variantId: query.variantId,
        }
      : {};

    const [totalStocks, stocks] = await Promise.all([
      this.prisma.stock.count({ where }),
      this.prisma.stock.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
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
      where: {
        variantId,
        quantityRemaining: {
          gt: 0,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const totalStock = batches.reduce(
      (sum, batch) => sum + batch.quantityRemaining,
      0,
    );

    const currentSellingPrice =
      batches.length > 0 ? batches[0].sellingPrice : 0;

    const currentPurchasePrice =
      batches.length > 0 ? batches[0].purchasePrice : 0;

    return {
      variantId,
      totalStock,
      currentSellingPrice,
      currentPurchasePrice,
      activeBatchesCount: batches.length,
    };
  }

  async calculateFifoPrice(variantId: string, quantity: number) {
    const batches = await this.prisma.stock.findMany({
      where: {
        variantId,
        quantityRemaining: {
          gt: 0,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const availableStock = batches.reduce(
      (sum, batch) => sum + batch.quantityRemaining,
      0,
    );

    if (availableStock < quantity) {
      return {
        variantId,
        quantity,
        totalPrice: 0,
        unitPriceAverage: 0,
        isAvailable: false,
        availableStock,
        batches: [],
      };
    }

    let remaining = quantity;
    let totalPrice = 0;

    const selectedBatches: {
      stockId: string;
      quantity: number;
      sellingPrice: number;
    }[] = [];

    for (const batch of batches) {
      if (remaining <= 0) {
        break;
      }

      const quantityFromBatch = Math.min(batch.quantityRemaining, remaining);

      totalPrice += quantityFromBatch * batch.sellingPrice;

      selectedBatches.push({
        stockId: batch.id,
        quantity: quantityFromBatch,
        sellingPrice: batch.sellingPrice,
      });

      remaining -= quantityFromBatch;
    }

    return {
      variantId,
      quantity,
      totalPrice,
      unitPriceAverage: totalPrice / quantity,
      isAvailable: true,
      availableStock,
      batches: selectedBatches,
    };
  }

  async deductFifoStock(variantId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    return this.prisma.$transaction(async (tx) => {
      const batches = await tx.stock.findMany({
        where: {
          variantId,
          quantityRemaining: {
            gt: 0,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const availableStock = batches.reduce(
        (sum, batch) => sum + batch.quantityRemaining,
        0,
      );

      if (availableStock < quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variantId}. Available: ${availableStock}, requested: ${quantity}`,
        );
      }

      let remaining = quantity;

      const deductions: {
        stockId: string;
        quantity: number;
        sellingPrice: number;
        purchasePrice: number;
      }[] = [];

      for (const batch of batches) {
        if (remaining <= 0) {
          break;
        }

        const deductQuantity = Math.min(batch.quantityRemaining, remaining);

        const updated = await tx.stock.updateMany({
          where: {
            id: batch.id,
            quantityRemaining: {
              gte: deductQuantity,
            },
          },
          data: {
            quantityRemaining: {
              decrement: deductQuantity,
            },
          },
        });

        if (updated.count !== 1) {
          throw new BadRequestException(
            'Stock changed while processing the order. Please retry.',
          );
        }

        deductions.push({
          stockId: batch.id,
          quantity: deductQuantity,
          sellingPrice: batch.sellingPrice,
          purchasePrice: batch.purchasePrice,
        });

        remaining -= deductQuantity;
      }

      if (remaining > 0) {
        throw new BadRequestException(
          'Unable to deduct the requested stock quantity',
        );
      }

      return {
        success: true,
        variantId,
        requested: quantity,
        deducted: quantity,
        deductions,
      };
    });
  }

  async getStockById(id: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { id },
    });

    if (!stock) {
      throw new NotFoundException('Stock batch not found');
    }

    return stock;
  }

  async deleteBatch(id: string) {
    const existing = await this.prisma.stock.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Stock batch not found');
    }

    if (existing.quantityRemaining !== existing.quantityReceived) {
      throw new BadRequestException(
        'Cannot delete a batch that has already been partially or fully sold',
      );
    }

    return this.prisma.stock.delete({
      where: { id },
    });
  }
}
