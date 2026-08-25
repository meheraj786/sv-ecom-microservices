import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
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
}

export class UpdateCartQuantityDto {
  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;
}
