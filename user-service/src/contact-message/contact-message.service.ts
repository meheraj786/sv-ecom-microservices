import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ContactMessage,
  ContactMessageDocument,
} from '../schemas/contact-message.schema';
import { CreateContactMessageDto } from './dto/create-contact-message.dto/create-contact-message.dto';

@Injectable()
export class ContactMessageService {
  constructor(
    @InjectModel(ContactMessage.name)
    private messageModel: Model<ContactMessageDocument>,
  ) {}

  async createMessage(dto: CreateContactMessageDto): Promise<ContactMessage> {
    const message = new this.messageModel(dto);
    return message.save();
  }

  async getMessages(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead === 'true' || query.isRead === true;
    }

    const [items, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getMessageById(id: string): Promise<ContactMessage> {
    const msg = await this.messageModel.findById(id).exec();
    if (!msg) {
      throw new NotFoundException('Contact message not found');
    }
    return msg;
  }

  async markAsRead(id: string): Promise<ContactMessage> {
    const msg = await this.messageModel
      .findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true })
      .exec();

    if (!msg) {
      throw new NotFoundException('Contact message not found');
    }
    return msg;
  }

  async deleteMessage(id: string): Promise<{ success: boolean }> {
    const result = await this.messageModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Contact message not found');
    }
    return { success: true };
  }
}
