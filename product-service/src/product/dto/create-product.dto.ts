import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Product slug is required' })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @IsString()
  @IsNotEmpty({ message: 'Product SKU is required' })
  sku: string;

  @IsString()
  @IsNotEmpty({ message: 'CategoryId is required' })
  categoryId: string;

  @IsString()
  @IsOptional()
  subCategoryId?: string;
}
