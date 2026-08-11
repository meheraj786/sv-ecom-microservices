import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { Prisma } from 'generated/prisma/client';
import { PaginationQueryDto } from './dto/pagination-query.dto';

// TODO: we can use failover mechanism for read and write

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.read.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException('Category slug already exists');
    }

    return this.prisma.write.category.create({
      data: dto,
    });
  }

  async getCategories(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [totalCategories, categories] = await Promise.all([
      this.prisma.read.category.count(),
      this.prisma.read.category.findMany({
        skip,
        take: limit,
        include: {
          subCategories: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      meta: {
        totalCategories,
        page,
        limit,
        totalPages: Math.ceil(totalCategories / limit),
      },
      categories,
    };
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    const existing = await this.prisma.read.subCategory.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException('Subcategory slug already exists');
    }

    const categoryExists = await this.prisma.read.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!categoryExists) {
      throw new BadRequestException('Parent Category does not exist');
    }

    return this.prisma.write.subCategory.create({
      data: dto,
    });
  }

  async getSubCategories(query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [totalSubCategories, subcategories] = await Promise.all([
      this.prisma.read.subCategory.count(),
      this.prisma.read.subCategory.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      meta: {
        totalSubCategories,
        page,
        limit,
        totalPages: Math.ceil(totalSubCategories / limit),
      },
      subcategories,
    };
  }
  async createProduct(dto: CreateProductDto) {
    const existingSlug = await this.prisma.read.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new BadRequestException('Product slug already exists');
    }

    const existingSku = await this.prisma.read.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new BadRequestException('Product SKU already exists');
    }

    const categoryExists = await this.prisma.read.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!categoryExists) {
      throw new BadRequestException('Parent Category does not exist');
    }

    if (dto.subCategoryId) {
      const subCategoryExists = await this.prisma.read.subCategory.findUnique({
        where: { id: dto.subCategoryId },
      });
      if (!subCategoryExists) {
        throw new BadRequestException('Optional SubCategory does not exist');
      }
    }

    return this.prisma.write.product.create({
      data: dto,
    });
  }

  async getProducts(query: GetProductsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.subCategoryId) {
      where.subCategoryId = query.subCategoryId;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = query.maxPrice;
      }
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [totalProducts, products] = await Promise.all([
      this.prisma.read.product.count({ where }),
      this.prisma.read.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          subCategory: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      meta: {
        totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
      products,
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.read.product.findUnique({
      where: { slug },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    return product;
  }
}
