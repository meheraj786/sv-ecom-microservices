import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(['PERCENTAGE', 'FIXED'])
  @IsNotEmpty()
  discountType: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}
