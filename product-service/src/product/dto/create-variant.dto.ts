import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty({ message: 'Variant SKU is required' })
  sku: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Fashion & Apparel
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() fabric?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() fit?: string;
  @IsOptional() @IsString() sleeve?: string;
  @IsOptional() @IsString() neckType?: string;
  @IsOptional() @IsString() pattern?: string;

  // Footwear
  @IsOptional() @IsString() shoeSize?: string;

  // Electronics
  @IsOptional() @IsString() ram?: string;
  @IsOptional() @IsString() storage?: string;
  @IsOptional() @IsString() processor?: string;
  @IsOptional() @IsString() screenSize?: string;
  @IsOptional() @IsString() connectivity?: string;

  // Beauty & Skincare
  @IsOptional() @IsString() volume?: string;
  @IsOptional() @IsString() shade?: string;
  @IsOptional() @IsString() skinType?: string;
  @IsOptional() @IsString() fragrance?: string;

  // Food & Grocery
  @IsOptional() @IsString() weight?: string;
  @IsOptional() @IsString() flavor?: string;
  @IsOptional() @IsString() packageType?: string;

  // Jewelry, Furniture, Books
  @IsOptional() @IsString() materialPurity?: string;
  @IsOptional() @IsString() strap?: string;
  @IsOptional() @IsString() dimensions?: string;
  @IsOptional() @IsString() format?: string;

  // Universal
  @IsOptional() @IsString() packQuantity?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() warranty?: string;
}

export class UpdateVariantDto extends CreateVariantDto {}
