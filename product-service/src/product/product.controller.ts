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
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/create-variant.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('category')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productService.createCategory(dto);
  }

  @Get('categories')
  getCategories(@Query() query: PaginationQueryDto) {
    return this.productService.getCategories(query);
  }

  @Get('category/:id')
  getCategoryById(@Param('id') id: string) {
    return this.productService.getCategoryById(id);
  }

  @Put('category/:id')
  updateCategory(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    return this.productService.updateCategory(id, dto);
  }

  @Delete('category/:id')
  deleteCategories(@Param('id') id: string) {
    return this.productService.deleteCategories(id);
  }

  @Post('subcategory')
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.productService.createSubCategory(dto);
  }

  @Get('subcategories')
  getSubCategories(@Query() query: PaginationQueryDto) {
    return this.productService.getSubCategories(query);
  }

  @Get('subcategory/:id')
  getSubCategoryById(@Param('id') id: string) {
    return this.productService.getSubCategoryById(id);
  }

  @Put('subcategory/:id')
  updateSubCategory(
    @Param('id') id: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.productService.updateSubCategory(id, dto);
  }

  @Delete('subcategory/:id')
  deleteSubCategories(@Param('id') id: string) {
    return this.productService.deleteSubCategories(id);
  }

  @Post('coupon-eligibility')
  getCouponEligibility(@Body('productIds') productIds: string[]) {
    return this.productService.getCouponEligibility(productIds);
  }

  @Post()
  createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Get()
  getProducts(@Query() query: GetProductsQueryDto) {
    return this.productService.getProducts(query);
  }

  @Put('variant/:id')
  updateVariant(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.productService.updateVariant(id, dto);
  }

  @Delete('variant/:id')
  deleteVariant(@Param('id') id: string) {
    return this.productService.deleteVariant(id);
  }

  @Post(':id/variant')
  createVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productService.createVariant(id, dto);
  }

  @Get(':id/variants')
  getVariantsByProduct(@Param('id') id: string) {
    return this.productService.getVariantsByProduct(id);
  }

  @Get('id/:id')
  getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Put(':id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.updateProduct(id, dto);
  }

  @Delete(':id')
  deleteProducts(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  @Get(':slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }
}
