import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Subcategory name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Subcategory slug is required' })
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'Parent categoryId is required' })
  categoryId: string;

  @IsString()
  @IsOptional()
  image?: string;
}
