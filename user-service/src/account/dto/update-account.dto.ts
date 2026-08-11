import { IsString, IsOptional, IsArray, IsHexColor } from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @IsHexColor({
    message: 'themeColor must be a valid hex color code (e.g., #6366F1)',
  })
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
