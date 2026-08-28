import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: false })
  password?: string;

  @Prop()
  name: string;

  @Prop({ default: 'local' })
  provider: string;

  @Prop({ required: false, index: true })
  googleId?: string;

  @Prop({ required: false })
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
