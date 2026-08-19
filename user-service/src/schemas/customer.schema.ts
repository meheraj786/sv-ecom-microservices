import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: false })
  isRegistered: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
