import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { AddBatchDto } from './dto/add-batch.dto';
import { CalculateFifoDto } from './dto/calculate-fifo.dto';
import { GetStocksQueryDto } from './dto/get-stocks-query.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('batch')
  addBatch(@Body() dto: AddBatchDto) {
    return this.inventoryService.addBatch(dto);
  }

  @Get('stocks')
  getStocks(@Query() query: GetStocksQueryDto) {
    return this.inventoryService.getStocks(query);
  }

  @Get('stock/:id')
  getStockById(@Param('id') id: string) {
    return this.inventoryService.getStockById(id);
  }

  @Get('summary/:variantId')
  getVariantStockSummary(@Param('variantId') variantId: string) {
    return this.inventoryService.getVariantStockSummary(variantId);
  }

  @Post('fifo-price')
  calculateFifoPrice(@Body() dto: CalculateFifoDto) {
    return this.inventoryService.calculateFifoPrice(
      dto.variantId,
      dto.quantity,
    );
  }

  @EventPattern('order_created')
  async handleOrderCreated(
    @Payload()
    data: {
      items: {
        variantId: string;
        quantity: number;
      }[];
    },
  ) {
    for (const item of data.items) {
      await this.inventoryService.deductFifoStock(
        item.variantId,
        item.quantity,
      );
    }

    return {
      success: true,
    };
  }

  @Delete('batch/:id')
  deleteBatch(@Param('id') id: string) {
    return this.inventoryService.deleteBatch(id);
  }
}
