import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Category slug is required' })
  slug: string;

  @IsString()
  @IsOptional()
  image?: string;
}
