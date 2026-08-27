import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBatchDto {
  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Purchase price must be 0 or greater' })
  purchasePrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Selling price must be 0 or greater' })
  sellingPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Quantity received must be at least 1' })
  quantityReceived: number;

  @IsOptional()
  @Type(() => Boolean)
  isDiscounted?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityRemaining?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  beforeDiscount?: number;

  @IsString()
  @IsOptional()
  note?: string;
}
