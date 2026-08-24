import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';

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
