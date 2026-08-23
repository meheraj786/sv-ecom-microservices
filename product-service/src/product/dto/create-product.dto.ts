import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @Type(() => Number)
  price: number;

  @IsString()
  @IsNotEmpty({ message: 'Product SKU is required' })
  sku: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category is required' })
  @IsString({ each: true })
  categoryIds: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  subCategoryIds?: string[];

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
