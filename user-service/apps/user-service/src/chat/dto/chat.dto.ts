import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  participantIds: string[];
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class MarkReadDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
