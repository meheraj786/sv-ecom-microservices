import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller()
export class ProductController {
  constructor(private productService: ProductService) {}



  @Post('product/category')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productService.createCategory(dto);
  }

  @Get('product/categories')
  getCategories(@Query() query: PaginationQueryDto) {
    return this.productService.getCategories(query);
  }

  // FIX: Single category fetch endpoint
  @Get('product/category/:id')
  getCategoryById(@Param('id') id: string) {
    return this.productService.getCategoryById(id);
  }

  // FIX: Update Category
  @Put('product/category/:id')
  updateCategory(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    return this.productService.updateCategory(id, dto);
  }

  @Delete('product/category/:id')
  deleteCategories(@Param('id') id: string) {
    return this.productService.deleteCategories(id);
  }

  // --- SUBCATEGORIES ---

  @Post('product/subcategory')
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.productService.createSubCategory(dto);
  }

  @Get('product/subcategories')
  getSubCategories(@Query() query: PaginationQueryDto) {
    return this.productService.getSubCategories(query);
  }

  // FIX: Update SubCategory
  @Put('product/subcategory/:id')
  updateSubCategory(
    @Param('id') id: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.productService.updateSubCategory(id, dto);
  }

  @Delete('product/subcategory/:id')
  deleteSubCategories(@Param('id') id: string) {
    return this.productService.deleteSubCategories(id);
  }

  @Post('product')
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Get('product')
  getProducts(@Query() query: GetProductsQueryDto) {
    return this.productService.getProducts(query);
  }

  @Delete('product/:id')
  deleteProducts(@Param('id') id: string) {
    return this.productService.deleteProducts(id);
  }

  @Get('product/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }
}
