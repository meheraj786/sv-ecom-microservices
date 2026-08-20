import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(['PERCENTAGE', 'FIXED'])
  @IsOptional()
  discountType?: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
