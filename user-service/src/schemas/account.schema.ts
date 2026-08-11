import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  vendorId: Types.ObjectId;

  @Prop({ default: '#6366F1' })
  themeColor: string;

  @Prop({ default: 'HERO_SPLIT' })
  bannerLayout: string;

  @Prop({ type: [String] })
  bannerImages: string[];

  @Prop({ type: [String] })
  featuredCategoryIds: string[];
}

export const AccountSchema = SchemaFactory.createForClass(Account);
