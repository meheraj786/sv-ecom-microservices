import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto, MarkReadDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, Set<string>>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.data.userId = userId;
      client.data.userName = client.handshake.query.userName || 'User';
      client.data.role = client.handshake.query.role || 'USER';

      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, new Set());
      }
      this.userSocketMap.get(userId)!.add(client.id);

      client.join(`user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSocketMap.has(userId)) {
      const sockets = this.userSocketMap.get(userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSocketMap.delete(userId);
      }
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ) {
    if (conversationId) {
      client.join(`conv_${conversationId}`);
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ) {
    if (conversationId) {
      client.leave(`conv_${conversationId}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const senderId = client.data.userId;
    const senderName = client.data.userName || 'User';
    const senderRole = client.data.role || 'USER';

    if (!senderId) return;

    const message = await this.chatService.saveMessage(
      senderId,
      senderName,
      senderRole,
      payload,
    );

    this.server
      .to(`conv_${payload.conversationId}`)
      .emit('newMessage', message);

    return message;
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkReadDto,
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.conversationId) return;

    await this.chatService.markAsRead(payload.conversationId, userId);

    this.server.to(`conv_${payload.conversationId}`).emit('messagesRead', {
      conversationId: payload.conversationId,
      userId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { conversationId: string; isTyping: boolean },
  ) {
    client.to(`conv_${payload.conversationId}`).emit('userTyping', {
      conversationId: payload.conversationId,
      userId: client.data.userId,
      userName: client.data.userName,
      isTyping: payload.isTyping,
    });
  }
}
