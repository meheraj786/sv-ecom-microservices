import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Coupon code is required' })
  code: string;
}
