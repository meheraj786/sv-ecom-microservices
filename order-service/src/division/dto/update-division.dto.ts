import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDivisionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Delivery charge must be a valid number' })
  @Min(0, { message: 'Delivery charge cannot be negative' })
  deliveryCharge?: number;
}
