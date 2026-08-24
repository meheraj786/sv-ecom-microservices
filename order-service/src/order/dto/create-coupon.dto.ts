import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Coupon code is required' })
  code: string;

  @IsString()
  @IsIn(['PERCENTAGE', 'FIXED'])
  discountType: 'PERCENTAGE' | 'FIXED';

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  discountValue: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  maxDiscount?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Expiry date is required' })
  expiresAt: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  perUserLimit?: number;

  @IsString()
  @IsIn(['ALL', 'PRODUCTS', 'CATEGORIES'])
  @IsOptional()
  scope?: 'ALL' | 'PRODUCTS' | 'CATEGORIES';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  productIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  categoryIds?: string[];
}
