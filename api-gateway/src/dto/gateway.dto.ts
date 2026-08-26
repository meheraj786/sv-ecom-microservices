import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

export class CreateProductOptionValueDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateProductOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionValueDto)
  values: CreateProductOptionValueDto[];
}

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
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
  @ArrayMinSize(1)
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

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ArrayUnique()
  categoryIds?: string[];

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
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  option?: string;

  @IsOptional()
  @IsString()
  optionValue?: string;

  @IsOptional()
  @IsIn([
    'newest',
    'oldest',
    'name-asc',
    'name-desc',
    'rating-high',
    'rating-low',
  ])
  sortBy?:
    | 'newest'
    | 'oldest'
    | 'name-asc'
    | 'name-desc'
    | 'rating-high'
    | 'rating-low';
}

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
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

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;
}

export class UpdateCartQuantityDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class AddBatchDto {
  @IsString()
  @IsNotEmpty()
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

  @IsOptional()
  @Type(() => Boolean)
  isDiscounted?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  beforeDiscount?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CalculateFifoDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
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

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  discountValue: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsDateString()
  expiresAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
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
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  discountValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  categoryIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsArray()
  items?: any[];
}

export class BillingInfoDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  divisionId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @ValidateNested()
  @Type(() => BillingInfoDto)
  @IsNotEmpty()
  billing: BillingInfoDto;
}

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryCharge: number;
}

export class UpdateDivisionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryCharge?: number;
}
