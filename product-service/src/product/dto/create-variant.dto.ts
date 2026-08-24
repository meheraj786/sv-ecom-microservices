import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsObject,
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

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;
}

export class UpdateVariantDto extends CreateVariantDto {}
