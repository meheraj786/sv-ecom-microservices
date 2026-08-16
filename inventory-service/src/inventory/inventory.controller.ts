import { Body, Controller, Post } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { AddBatchDto } from './dto/add-batch.dto';

@Controller()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post('inventory/batch')
  addBatch(@Body() dto: AddBatchDto) {
    return this.inventoryService.addBatch(dto);
  }

  @Post('inventory/fifo-price')
  calculateFifoPrice(@Body() dto: { productId: string; quantity: number }) {
    return this.inventoryService.calculateFifoPrice(
      dto.productId,
      dto.quantity,
    );
  }

  @EventPattern('order_created')
  async handleOrderCreated(
    @Payload() data: { items: { productId: string; quantity: number }[] },
  ) {
    console.log('RabbitMQ: Received order_created event in Inventory Service!');

    const promises = data.items.map((item) =>
      this.inventoryService.deductFifoStock(item.productId, item.quantity),
    );
    await Promise.all(promises);
  }
}
