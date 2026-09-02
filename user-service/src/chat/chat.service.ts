import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { SendMessageDto } from './dto/chat.dto';
import {
  Conversation,
  ConversationDocument,
} from '../schemas/conversation.schema';
import { Message, MessageDocument } from '../schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async getOrCreateConversation(userA: string, userB: string) {
    if (userA === userB) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    let conversation = await this.conversationModel.findOne({
      participants: { $all: [userA, userB], $size: 2 },
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [userA, userB],
        unreadCount: {
          [userA]: 0,
          [userB]: 0,
        },
      });
    }

    return conversation;
  }

  async getUserConversations(userId: string) {
    return this.conversationModel
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getConversationMessages(conversationId: string, page = 1, limit = 50) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation ID');
    }

    const skip = (page - 1) * limit;

    const [total, messages] = await Promise.all([
      this.messageModel.countDocuments({
        conversationId: new Types.ObjectId(conversationId),
      }),
      this.messageModel
        .find({ conversationId: new Types.ObjectId(conversationId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      messages: messages.reverse(),
    };
  }

  async saveMessage(
    senderId: string,
    senderName: string,
    senderRole: string,
    dto: SendMessageDto,
  ) {
    if (!Types.ObjectId.isValid(dto.conversationId)) {
      throw new BadRequestException('Invalid conversation ID');
    }

    const conversation = await this.conversationModel.findById(
      dto.conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(dto.conversationId),
      senderId,
      senderName,
      senderRole,
      content: dto.content,
      attachments: dto.attachments || [],
      readBy: [senderId],
    });

    const isSenderAdmin = senderRole === 'ADMIN' || senderRole === 'STAFF';
    const incUpdate: Record<string, number> = {};

    conversation.participants.forEach((p) => {
      if (isSenderAdmin) {
        if (p !== 'ADMIN') {
          incUpdate[`unreadCount.${p}`] = 1;
        }
      } else {
        if (p === 'ADMIN') {
          incUpdate[`unreadCount.ADMIN`] = 1;
        }
      }
    });

    const resetKey = isSenderAdmin ? 'ADMIN' : senderId;

    const updateDoc: any = {
      $set: {
        lastMessage: dto.content,
        lastMessageSenderId: senderId,
        lastMessageAt: new Date(),
        [`unreadCount.${resetKey}`]: 0,
      },
    };

    if (Object.keys(incUpdate).length > 0) {
      updateDoc.$inc = incUpdate;
    }

    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(dto.conversationId) },
      updateDoc,
    );

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    if (!Types.ObjectId.isValid(conversationId) || !userId) return;

    const resetKey =
      userId === 'ADMIN' || userId.startsWith('ADMIN') ? 'ADMIN' : userId;

    await Promise.all([
      this.messageModel.updateMany(
        {
          conversationId: new Types.ObjectId(conversationId),
          readBy: { $ne: userId },
        },
        { $addToSet: { readBy: userId } },
      ),
      this.conversationModel.updateOne(
        { _id: new Types.ObjectId(conversationId) },
        {
          $set: {
            [`unreadCount.${resetKey}`]: 0,
          },
        },
      ),
    ]);
  }
}
