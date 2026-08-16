import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('auth/register')
  registerUser(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }

  @Post('auth/login')
  loginUser(@Body() dto: LoginDto) {
    return this.authService.loginUser(dto);
  }

  @Post('auth/vendor/register')
  registerVendor(@Body() dto: RegisterVendorDto) {
    return this.authService.registerVendor(dto);
  }

  @Post('auth/vendor/login')
  loginVendor(@Body() dto: LoginDto) {
    return this.authService.loginVendor(dto);
  }
}
