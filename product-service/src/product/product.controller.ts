import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Post('product/subcategory')
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.productService.createSubCategory(dto);
  }

  @Get('product/subcategories')
  getSubCategories(@Query() query: PaginationQueryDto) {
    return this.productService.getSubCategories(query);
  }

  @Post('product')
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Get('product')
  getProducts(@Query() query: GetProductsQueryDto) {
    return this.productService.getProducts(query);
  }

  @Get('product/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }
}
