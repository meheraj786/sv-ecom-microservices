import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [{ type: String, required: true }] })
  participants: string[];

  @Prop({ type: String, default: '' })
  lastMessage: string;

  @Prop({ type: String })
  lastMessageSenderId: string;

  @Prop({ type: Date, default: Date.now })
  lastMessageAt: Date;

  @Prop({ type: Object, default: {} })
  unreadCount: Record<string, number>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });
