import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateFifoDto {
  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
