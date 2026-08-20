import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.write.category.findUnique({
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

    if (totalCategories === 0 && categories.length === 0 && page === 1) {
      const [masterTotal, masterCategories] = await Promise.all([
        this.prisma.write.category.count(),
        this.prisma.write.category.findMany({
          skip,
          take: limit,
          include: { subCategories: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (masterTotal > 0) {
        return {
          meta: {
            totalCategories: masterTotal,
            page,
            limit,
            totalPages: Math.ceil(masterTotal / limit),
          },
          categories: masterCategories,
        };
      }
    }

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
    const existing = await this.prisma.write.subCategory.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException('Subcategory slug already exists');
    }

    const categoryExists = await this.prisma.write.category.findUnique({
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

    if (totalSubCategories === 0 && subcategories.length === 0 && page === 1) {
      const [masterTotal, masterSubcategories] = await Promise.all([
        this.prisma.write.subCategory.count(),
        this.prisma.write.subCategory.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (masterTotal > 0) {
        return {
          meta: {
            totalSubCategories: masterTotal,
            page,
            limit,
            totalPages: Math.ceil(masterTotal / limit),
          },
          subcategories: masterSubcategories,
        };
      }
    }

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
    const existingSlug = await this.prisma.write.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new BadRequestException('Product slug already exists');
    }

    const existingSku = await this.prisma.write.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new BadRequestException('Product SKU already exists');
    }

    const categoryExists = await this.prisma.write.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!categoryExists) {
      throw new BadRequestException('Parent Category does not exist');
    }

    if (dto.subCategoryId) {
      const subCategoryExists = await this.prisma.write.subCategory.findUnique({
        where: { id: dto.subCategoryId },
      });
      if (!subCategoryExists) {
        throw new BadRequestException('Optional SubCategory does not exist');
      }
    }

    const { subCategoryId, price, ...productData } = dto;

    return this.prisma.write.product.create({
      data: {
        ...productData,
        basePrice: price,
        subCategoryId: subCategoryId || null,
      },
    });
  }

  async getProducts(query: GetProductsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.subCategoryId) {
      where.subCategoryId = query.subCategoryId;
    }

    if (query.isNew !== undefined) {
      where.isNew = query.isNew;
    }

    if (query.isBestSeller !== undefined) {
      where.isBestSeller = query.isBestSeller;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) {
        where.basePrice.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.basePrice.lte = query.maxPrice;
      }
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.color || query.size || query.inStock !== undefined) {
      const variantFilter: Prisma.ProductVariantWhereInput = {};

      if (query.color) {
        variantFilter.color = { equals: query.color, mode: 'insensitive' };
      }

      if (query.size) {
        variantFilter.size = { equals: query.size, mode: 'insensitive' };
      }

      if (query.inStock === true) {
        variantFilter.quantityRemaining = { gt: 0 };
      }

      where.variants = {
        some: variantFilter,
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (query.sortBy) {
      if (query.sortBy === 'price-low') {
        orderBy = { basePrice: 'asc' };
      } else if (query.sortBy === 'price-high') {
        orderBy = { basePrice: 'desc' };
      } else if (query.sortBy === 'rating-high') {
        orderBy = { averageRating: 'desc' };
      } else if (query.sortBy === 'reviews-count') {
        orderBy = { reviews: { _count: 'desc' } };
      } else if (query.sortBy === 'newest') {
        orderBy = { createdAt: 'desc' };
      }
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
          variants: true,
          reviews: true,
        },
        orderBy,
      }),
    ]);

    if (totalProducts === 0 && products.length === 0 && page === 1) {
      const [masterTotal, masterProducts] = await Promise.all([
        this.prisma.write.product.count({ where }),
        this.prisma.write.product.findMany({
          where,
          skip,
          take: limit,
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
            variants: true,
            reviews: true,
          },
          orderBy,
        }),
      ]);

      if (masterTotal > 0) {
        return {
          meta: {
            totalProducts: masterTotal,
            page,
            limit,
            totalPages: Math.ceil(masterTotal / limit),
          },
          products: masterProducts,
        };
      }
    }

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
    let product = await this.prisma.read.product.findUnique({
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
      product = await this.prisma.write.product.findUnique({
        where: { slug },
        include: {
          subCategory: {
            include: {
              category: true,
            },
          },
        },
      });
    }

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    return product;
  }
  // delete category
  async deleteCategories(id: string): Promise<void> {
    await this.prisma.write.category.delete({ where: { id } });
  }

  async deleteSubCategories(id: string): Promise<void> {
    await this.prisma.write.subCategory.delete({ where: { id } });
  }

  async deleteProducts(id: string): Promise<void> {
    await this.prisma.write.product.delete({ where: { id } });
  }
}
