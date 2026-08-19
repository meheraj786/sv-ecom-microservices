import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customerService.createCustomer(dto);
  }

  @Get()
  getCustomers(@Query() query: PaginationQueryDto) {
    return this.customerService.getCustomers(query);
  }

  @Get(':id')
  getCustomerById(@Param('id') id: string) {
    return this.customerService.getCustomerById(id);
  }

  @Put(':id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.updateCustomer(id, dto);
  }

  @Delete(':id')
  deleteCustomer(@Param('id') id: string) {
    return this.customerService.deleteCustomer(id);
  }

  @EventPattern('order_created')
  async handleOrderCreated(@Payload() data: any) {
    console.log(
      'RabbitMQ: Received order_created event inside Customer Service!',
    );

    if (data.billing) {
      await this.customerService.upsertCustomerLead({
        name: data.billing.fullName,
        email: data.billing.email,
        phone: data.billing.phone,
        address: `${data.billing.address}, ${data.billing.city} ${data.billing.zipCode}`,
        isRegistered: data.userId ? true : false,
      });
    }
  }
}
