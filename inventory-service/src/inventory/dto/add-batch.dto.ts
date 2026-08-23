import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddBatchDto {
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

  @IsString()
  @IsOptional()
  note?: string;
}
