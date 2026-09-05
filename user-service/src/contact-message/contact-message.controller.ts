import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ContactMessageService } from './contact-message.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto/create-contact-message.dto';

@Controller('contact-message')
export class ContactMessageController {
  constructor(private readonly contactMessageService: ContactMessageService) {}

  @Post()
  createMessage(@Body() dto: CreateContactMessageDto) {
    return this.contactMessageService.createMessage(dto);
  }

  @Get()
  getMessages(@Query() query: any) {
    return this.contactMessageService.getMessages(query);
  }

  @Get(':id')
  getMessageById(@Param('id') id: string) {
    return this.contactMessageService.getMessageById(id);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.contactMessageService.markAsRead(id);
  }

  @Delete(':id')
  deleteMessage(@Param('id') id: string) {
    return this.contactMessageService.deleteMessage(id);
  }
}
