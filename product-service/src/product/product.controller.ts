import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices'; // <--- Import GrpcMethod Decorator
import { ProductService } from './product.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller()
export class ProductController {
  constructor(private productService: ProductService) {}

  @GrpcMethod('ProductGrpcService', 'CreateCategory')
  createCategory(dto: CreateCategoryDto) {
    return this.productService.createCategory(dto);
  }

  @GrpcMethod('ProductGrpcService', 'GetCategories')
  getCategories(query: PaginationQueryDto) {
    return this.productService.getCategories(query);
  }

  @GrpcMethod('ProductGrpcService', 'CreateSubCategory')
  createSubCategory(dto: CreateSubCategoryDto) {
    return this.productService.createSubCategory(dto);
  }

  @GrpcMethod('ProductGrpcService', 'GetSubCategories')
  getSubCategories(query: PaginationQueryDto) {
    return this.productService.getSubCategories(query);
  }

  @GrpcMethod('ProductGrpcService', 'CreateProduct')
  createProduct(dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @GrpcMethod('ProductGrpcService', 'GetProducts')
  getProducts(query: GetProductsQueryDto) {
    return this.productService.getProducts(query);
  }

  @GrpcMethod('ProductGrpcService', 'GetProductBySlug')
  getProductBySlug(dto: { slug: string }) {
    return this.productService.getProductBySlug(dto.slug);
  }
}
