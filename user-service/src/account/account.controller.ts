import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices'; // <--- Import GrpcMethod
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller()
export class AccountController {
  constructor(private accountService: AccountService) {}

  @GrpcMethod('UserGrpcService', 'GetSettings')
  getSettings(dto: { vendorId: string }) {
    return this.accountService.getSettings(dto.vendorId);
  }

  @GrpcMethod('UserGrpcService', 'UpdateSettings')
  updateSettings(dto: UpdateAccountDto & { vendorId: string }) {
    const { vendorId, ...updateDto } = dto;
    return this.accountService.updateSettings(vendorId, updateDto);
  }
}
