import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'productId is required' })
  productId: string;

  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;
}

export class UpdateCartQuantityDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;
}
