import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices'; // <--- Import GrpcMethod Decorator
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @GrpcMethod('UserGrpcService', 'RegisterUser')
  registerUser(dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }

  @GrpcMethod('UserGrpcService', 'LoginUser')
  loginUser(dto: LoginDto) {
    return this.authService.loginUser(dto);
  }

  @GrpcMethod('UserGrpcService', 'RegisterVendor')
  registerVendor(dto: RegisterVendorDto) {
    return this.authService.registerVendor(dto);
  }

  @GrpcMethod('UserGrpcService', 'LoginVendor')
  loginVendor(dto: LoginDto) {
    return this.authService.loginVendor(dto);
  }
}
