import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Coupon code is required' })
  code: string;

  @IsOptional()
  @IsArray()
  items?: {
    productId: string;
    variantId: string;
    quantity: number;
    price?: number;
  }[];
}
