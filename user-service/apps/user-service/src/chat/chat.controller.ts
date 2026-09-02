import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  async getOrCreateConversation(
    @Body('userA') userA: string,
    @Body('userB') userB: string,
  ) {
    return this.chatService.getOrCreateConversation(userA, userB);
  }

  @Get('conversations/:userId')
  async getUserConversations(@Param('userId') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  @Get('messages/:conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getConversationMessages(
      conversationId,
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  @Post('message')
  async sendMessage(
    @Req() req: any,
    @Body()
    body: {
      senderId: string;
      senderName: string;
      senderRole: string;
      payload: SendMessageDto;
    },
  ) {
    return this.chatService.saveMessage(
      body.senderId,
      body.senderName,
      body.senderRole,
      body.payload,
    );
  }

  @Post('read')
  async markRead(
    @Body('conversationId') conversationId: string,
    @Body('userId') userId: string,
  ) {
    await this.chatService.markAsRead(conversationId, userId);
    return { success: true };
  }
}
