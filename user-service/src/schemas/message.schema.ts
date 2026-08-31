import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversationId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  senderId: string;

  @Prop({ type: String, required: true })
  senderName: string;

  @Prop({
    type: String,
    enum: ['USER', 'VENDOR', 'ADMIN', 'STAFF'],
    default: 'USER',
  })
  senderRole: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [String], default: [] })
  readBy: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: 1 });
