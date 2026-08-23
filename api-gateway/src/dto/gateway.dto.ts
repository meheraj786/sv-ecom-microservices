import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
  IsNumber,
  Min,
  IsHexColor,
  IsArray,
  IsBoolean,
  IsEnum,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class RegisterVendorDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'STAFF'])
  role?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @IsHexColor()
  themeColor?: string;

  @IsString()
  @IsOptional()
  bannerLayout?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bannerImages?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  featuredCategoryIds?: string[];
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class CreateSubCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsString()
  image?: string;
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

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPrice?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category is required' })
  @IsString({ each: true })
  categoryIds: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
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
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  baseImage?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPrice?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
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
}

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty({ message: 'Variant SKU is required' })
  sku: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  storage?: string;

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
}

export class UpdateVariantDto {
  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  storage?: string;

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
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class GetProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'rating-high';
}

export class AddToCartDto {
  @IsString()
  @IsNotEmpty({ message: 'productId is required' })
  productId: string;

  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}

export class UpdateCartQuantityDto {
  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class AddBatchDto {
  @IsString()
  @IsNotEmpty({ message: 'variantId is required' })
  variantId: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantityReceived: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class GetStocksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  variantId?: string;
}

export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum CouponScope {
  ALL = 'ALL',
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
}

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;

  @IsNumber()
  @Min(0.01)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsDateString()
  expiresAt: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsEnum(CouponDiscountType)
  discountType?: CouponDiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty({ message: 'Division name is required' })
  name: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Delivery charge must be a valid number' })
  @Min(0, { message: 'Delivery charge cannot be negative' })
  deliveryCharge: number;
}

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
