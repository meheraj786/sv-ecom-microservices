import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVariantDto } from './create-variant.dto';

export class CreateProductOptionValueDto {
  @IsString()
  @IsNotEmpty({ message: 'Option value is required' })
  value: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateProductOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Option name is required' })
  name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one option value is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionValueDto)
  values: CreateProductOptionValueDto[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Product slug is required' })
  slug: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  baseImage?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category is required' })
  @IsString({ each: true })
  @ArrayUnique()
  categoryIds: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ArrayUnique()
  subCategoryIds?: string[];

  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isBestSeller?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  options?: CreateProductOptionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
