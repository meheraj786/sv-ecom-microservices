import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty({ message: 'Variant SKU is required' })
  sku: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  optionValueIds?: string[];
}

export class UpdateVariantDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  sku?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  optionValueIds?: string[];
}
