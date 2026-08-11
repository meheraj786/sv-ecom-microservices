import { Controller } from '@nestjs/common';
import { GrpcMethod, EventPattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { AddBatchDto } from './dto/add-batch.dto';

@Controller()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // 1. gRPC Write endpoint (Admin add procurement batch)
  @GrpcMethod('InventoryGrpcService', 'AddBatch')
  addBatch(dto: AddBatchDto) {
    return this.inventoryService.addBatch(dto);
  }

  // 2. gRPC Sync read endpoint (Calculates billing price based on FIFO)
  @GrpcMethod('InventoryGrpcService', 'CalculateFifoPrice')
  calculateFifoPrice(dto: { productId: string; quantity: number }) {
    return this.inventoryService.calculateFifoPrice(
      dto.productId,
      dto.quantity,
    );
  }

  // 3. RabbitMQ Asynchronous Event listener
  // Listens to global 'order_created' queue event
  @EventPattern('order_created')
  async handleOrderCreated(
    @Payload() data: { items: { productId: string; quantity: number }[] },
  ) {
    console.log('RabbitMQ: Received order_created event in Inventory Service!');

    // Asynchronously deduct stock for each order item in parallel using FIFO
    const promises = data.items.map((item) =>
      this.inventoryService.deductFifoStock(item.productId, item.quantity),
    );
    await Promise.all(promises);
  }
}
