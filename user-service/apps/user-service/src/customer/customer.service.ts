import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async upsertCustomerLead(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    isRegistered: boolean;
  }) {
    await this.customerModel.findOneAndUpdate(
      { phone: data.phone },
      { $set: data },
      { upsert: true, new: true },
    );
    console.log(
      `CRM: Successfully upserted customer lead for phone ${data.phone}`,
    );
  }

  async createCustomer(dto: CreateCustomerDto) {
    const existing = await this.customerModel.findOne({ phone: dto.phone });
    if (existing) {
      throw new BadRequestException(
        'Customer with this phone number already exists',
      );
    }
    return this.customerModel.create(dto);
  }

  async getCustomers(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, customers] = await Promise.all([
      this.customerModel.countDocuments(),
      this.customerModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    return {
      meta: {
        totalCustomers: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      customers,
    };
  }

  async getCustomerById(id: string) {
    const customer = await this.customerModel.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const customer = await this.customerModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async deleteCustomer(id: string) {
    const customer = await this.customerModel.findByIdAndDelete(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return { message: 'Customer deleted successfully from CRM' };
  }
}
