import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty({ message: 'Division name is required' })
  name: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Delivery charge must be a valid number' })
  @Min(0, { message: 'Delivery charge cannot be negative' })
  deliveryCharge: number;
}
