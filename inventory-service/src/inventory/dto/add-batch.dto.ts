import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddBatchDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsString()
  @IsNotEmpty()
  batchNumber?: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @IsNumber()
  @Min(1)
  quantityReceived: number;
}
