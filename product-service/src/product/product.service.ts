import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/create-variant.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

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

  async getCategoryById(id: string) {
    let category = await this.prisma.read.category.findUnique({
      where: { id },
      include: {
        subCategories: true,
      },
    });

    if (!category) {
      category = await this.prisma.write.category.findUnique({
        where: { id },
        include: {
          subCategories: true,
        },
      });
    }

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, dto: CreateCategoryDto) {
    await this.getCategoryById(id);

    const existingSlug = await this.prisma.write.category.findFirst({
      where: {
        slug: dto.slug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      throw new BadRequestException('Category slug already exists');
    }

    return this.prisma.write.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategories(id: string): Promise<void> {
    await this.prisma.write.category.delete({
      where: { id },
    });
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

  async getSubCategoryById(id: string) {
    let subCategory = await this.prisma.read.subCategory.findUnique({
      where: { id },
    });

    if (!subCategory) {
      subCategory = await this.prisma.write.subCategory.findUnique({
        where: { id },
      });
    }

    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }

    return subCategory;
  }

  async updateSubCategory(id: string, dto: CreateSubCategoryDto) {
    await this.getSubCategoryById(id);

    const existingSlug = await this.prisma.write.subCategory.findFirst({
      where: {
        slug: dto.slug,
        NOT: { id },
      },
    });

    if (existingSlug) {
      throw new BadRequestException('SubCategory slug already exists');
    }

    return this.prisma.write.subCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSubCategories(id: string): Promise<void> {
    await this.prisma.write.subCategory.delete({
      where: { id },
    });
  }

  async getCouponEligibility(productIds: string[]) {
    if (!productIds.length) {
      return [];
    }

    const select = {
      id: true,
      categories: {
        select: {
          categoryId: true,
        },
      },
    };

    const products = await this.prisma.read.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        isActive: true,
      },
      select,
    });

    if (products.length === 0) {
      return this.prisma.write.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          isActive: true,
        },
        select,
      });
    }

    return products;
  }

  async createProduct(dto: CreateProductDto) {
    const existingSlug = await this.prisma.write.product.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Product slug already exists');
    }

    if (dto.sku) {
      const existingSku = await this.prisma.write.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new BadRequestException('Product SKU already exists');
      }
    }

    const {
      categoryIds,
      subCategoryIds,
      baseImage,
      images,
      variants,
      ...productData
    } = dto;

    const productImages = images || (baseImage ? [baseImage] : []);

    return this.prisma.write.product.create({
      data: {
        ...productData,
        baseImage: baseImage || productImages[0] || null,
        images: productImages,
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
        subCategories: subCategoryIds?.length
          ? {
              create: subCategoryIds.map((subCategoryId) => ({
                subCategoryId,
              })),
            }
          : undefined,
        variants: variants?.length
          ? {
              create: variants.map((v) => ({
                sku: v.sku,
                color: v.color,
                size: v.size,
                fabric: v.fabric,
                material: v.material,
                fit: v.fit,
                sleeve: v.sleeve,
                neckType: v.neckType,
                pattern: v.pattern,
                shoeSize: v.shoeSize,
                ram: v.ram,
                storage: v.storage,
                processor: v.processor,
                screenSize: v.screenSize,
                connectivity: v.connectivity,
                volume: v.volume,
                shade: v.shade,
                skinType: v.skinType,
                fragrance: v.fragrance,
                weight: v.weight,
                flavor: v.flavor,
                packageType: v.packageType,
                materialPurity: v.materialPurity,
                strap: v.strap,
                dimensions: v.dimensions,
                format: v.format,
                packQuantity: v.packQuantity,
                condition: v.condition,
                warranty: v.warranty,
                price: v.price,
                images: v.images || [],
                isActive: v.isActive ?? true,
              })),
            }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
        subCategories: { include: { subCategory: true } },
        variants: true,
      },
    });
  }

  async getProducts(query: GetProductsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.categoryId) {
      where.categories = { some: { categoryId: query.categoryId } };
    }

    if (query.subCategoryId) {
      where.subCategories = { some: { subCategoryId: query.subCategoryId } };
    }

    if (query.isNew !== undefined) where.isNew = query.isNew;
    if (query.isBestSeller !== undefined)
      where.isBestSeller = query.isBestSeller;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) where.basePrice.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.basePrice.lte = query.maxPrice;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.color || query.size) {
      where.variants = {
        some: {
          ...(query.color && {
            color: { equals: query.color, mode: 'insensitive' },
          }),
          ...(query.size && {
            size: { equals: query.size, mode: 'insensitive' },
          }),
        },
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    if (query.sortBy === 'price-low') orderBy = { basePrice: 'asc' };
    else if (query.sortBy === 'price-high') orderBy = { basePrice: 'desc' };

    const [totalProducts, products] = await Promise.all([
      this.prisma.read.product.count({ where }),
      this.prisma.read.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          categories: { include: { category: true } },
          subCategories: { include: { subCategory: true } },
          variants: true,
          reviews: true,
        },
        orderBy,
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

  async getProductById(id: string) {
    const product = await this.prisma.read.product.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        subCategories: { include: { subCategory: true } },
        variants: true,
        reviews: true,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.read.product.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        subCategories: { include: { subCategory: true } },
        variants: true,
        reviews: true,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.getProductById(id);

    const {
      categoryIds,
      subCategoryIds,
      baseImage,
      images,
      variants,
      ...productData
    } = dto;

    return this.prisma.write.product.update({
      where: { id },
      data: {
        ...productData,
        ...(baseImage !== undefined && { baseImage }),
        ...(images !== undefined && { images }),
        ...(categoryIds && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        }),
        ...(subCategoryIds && {
          subCategories: {
            deleteMany: {},
            create: subCategoryIds.map((subCategoryId) => ({
              subCategoryId,
            })),
          },
        }),
      },
      include: {
        categories: { include: { category: true } },
        subCategories: { include: { subCategory: true } },
        variants: true,
      },
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await this.prisma.write.product.delete({ where: { id } });
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    await this.getProductById(productId);

    const existingSku = await this.prisma.write.productVariant.findFirst({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new BadRequestException('Variant SKU already exists');
    }

    return this.prisma.write.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        color: dto.color,
        size: dto.size,
        fabric: dto.fabric,
        material: dto.material,
        fit: dto.fit,
        sleeve: dto.sleeve,
        neckType: dto.neckType,
        pattern: dto.pattern,
        shoeSize: dto.shoeSize,
        ram: dto.ram,
        storage: dto.storage,
        processor: dto.processor,
        screenSize: dto.screenSize,
        connectivity: dto.connectivity,
        volume: dto.volume,
        shade: dto.shade,
        skinType: dto.skinType,
        fragrance: dto.fragrance,
        weight: dto.weight,
        flavor: dto.flavor,
        packageType: dto.packageType,
        materialPurity: dto.materialPurity,
        strap: dto.strap,
        dimensions: dto.dimensions,
        format: dto.format,
        packQuantity: dto.packQuantity,
        condition: dto.condition,
        warranty: dto.warranty,
        price: dto.price,
        images: dto.images || [],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getVariantsByProduct(productId: string) {
    return this.prisma.read.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateVariant(id: string, dto: UpdateVariantDto) {
    const existing = await this.prisma.write.productVariant.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Variant not found');

    if (dto.sku && dto.sku !== existing.sku) {
      const skuTaken = await this.prisma.write.productVariant.findFirst({
        where: { sku: dto.sku },
      });
      if (skuTaken) throw new BadRequestException('Variant SKU already exists');
    }

    return this.prisma.write.productVariant.update({
      where: { id },
      data: {
        sku: dto.sku,
        color: dto.color,
        size: dto.size,
        fabric: dto.fabric,
        material: dto.material,
        fit: dto.fit,
        sleeve: dto.sleeve,
        neckType: dto.neckType,
        pattern: dto.pattern,
        shoeSize: dto.shoeSize,
        ram: dto.ram,
        storage: dto.storage,
        processor: dto.processor,
        screenSize: dto.screenSize,
        connectivity: dto.connectivity,
        volume: dto.volume,
        shade: dto.shade,
        skinType: dto.skinType,
        fragrance: dto.fragrance,
        weight: dto.weight,
        flavor: dto.flavor,
        packageType: dto.packageType,
        materialPurity: dto.materialPurity,
        strap: dto.strap,
        dimensions: dto.dimensions,
        format: dto.format,
        packQuantity: dto.packQuantity,
        condition: dto.condition,
        warranty: dto.warranty,
        price: dto.price,
        images: dto.images,
        isActive: dto.isActive,
      },
    });
  }

  async deleteVariant(id: string) {
    const existing = await this.prisma.write.productVariant.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Variant not found');

    await this.prisma.write.productVariant.delete({ where: { id } });
  }
}
