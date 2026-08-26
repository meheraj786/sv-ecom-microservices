import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AddBatchDto } from './dto/add-batch.dto';
import { CalculateFifoDto } from './dto/calculate-fifo.dto';
import { GetStocksQueryDto } from './dto/get-stocks-query.dto';
import { DeductStockDto } from './dto/deduct-stock.dto';

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

  @Post('deduct-fifo')
  deductFifoStock(@Body() dto: DeductStockDto) {
    return this.inventoryService.deductMultipleFifoStocks(dto.items);
  }

  @Delete('batch/:id')
  deleteBatch(@Param('id') id: string) {
    return this.inventoryService.deleteBatch(id);
  }
}
