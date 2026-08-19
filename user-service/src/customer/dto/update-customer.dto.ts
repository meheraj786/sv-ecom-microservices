import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Invalid email address format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isRegistered?: boolean;
}
