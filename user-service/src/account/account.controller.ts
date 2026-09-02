import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller()
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Get('account/:vendorId')
  getSettings(@Param('vendorId') vendorId: string) {
    return this.accountService.getSettings(vendorId);
  }

  @Post('account/update')
  updateSettings(@Body() dto: UpdateAccountDto & { vendorId: string }) {
    const { vendorId, ...updateDto } = dto;
    return this.accountService.updateSettings(vendorId, updateDto);
  }
}
