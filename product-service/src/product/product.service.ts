import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/create-variant.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productInclude = {
    categories: {
      include: {
        category: true,
      },
    },
    subCategories: {
      include: {
        subCategory: true,
      },
    },
    productOptions: {
      orderBy: {
        name: 'asc' as const,
      },
      include: {
        productOptionValues: {
          orderBy: {
            value: 'asc' as const,
          },
        },
      },
    },
    variants: {
      orderBy: {
        combinationKey: 'asc' as const,
      },
      include: {
        productVariantValues: {
          include: {
            optionValue: {
              include: {
                option: true,
              },
            },
          },
        },
      },
    },
    reviews: true,
  } satisfies Prisma.ProductInclude;

  private async readWithFallback<T>(
    readQuery: () => Promise<T>,
    writeQuery: () => Promise<T>,
    isEmpty: (result: T) => boolean,
  ): Promise<T> {
    const result = await readQuery();

    if (!isEmpty(result)) {
      return result;
    }

    return writeQuery();
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private buildCombinationKey(
    optionValues: Array<{
      option: {
        name: string;
      };
      value: string;
    }>,
  ): string {
    return [...optionValues]
      .sort((a, b) =>
        this.normalize(a.option.name).localeCompare(
          this.normalize(b.option.name),
        ),
      )
      .map(
        (item) =>
          `${this.normalize(item.option.name)}:${this.normalize(item.value)}`,
      )
      .join('|');
  }

  private generateDefaultSku(): string {
    return `PROD-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
  }

  private async validateCategories(
    categoryIds: string[],
    subCategoryIds?: string[],
  ) {
    const categories = await this.prisma.write.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('One or more categories are invalid');
    }

    if (subCategoryIds?.length) {
      const subCategories = await this.prisma.write.subCategory.findMany({
        where: {
          id: {
            in: subCategoryIds,
          },
        },
        select: {
          id: true,
          categoryId: true,
        },
      });

      if (subCategories.length !== subCategoryIds.length) {
        throw new BadRequestException('One or more subcategories are invalid');
      }

      const categorySet = new Set(categoryIds);

      const invalidSubCategory = subCategories.some(
        (item) => !categorySet.has(item.categoryId),
      );

      if (invalidSubCategory) {
        throw new BadRequestException(
          'Every subcategory must belong to one of the selected categories',
        );
      }
    }
  }

  private async validateOptionInput(options: CreateProductDto['options']) {
    if (!options?.length) {
      return;
    }

    const optionNames = new Set<string>();

    for (const option of options) {
      const optionName = this.normalize(option.name);

      if (optionNames.has(optionName)) {
        throw new BadRequestException(
          `Duplicate product option: ${option.name}`,
        );
      }

      optionNames.add(optionName);

      const valueSet = new Set<string>();

      for (const item of option.values) {
        const value = this.normalize(item.value);

        if (valueSet.has(value)) {
          throw new BadRequestException(
            `Duplicate value "${item.value}" in option "${option.name}"`,
          );
        }

        valueSet.add(value);
      }
    }
  }

  private async resolveVariantOptionValues(
    productId: string,
    optionValueIds: string[],
  ) {
    const values = await this.prisma.write.productOptionValue.findMany({
      where: {
        id: {
          in: optionValueIds,
        },
        option: {
          productId,
        },
      },
      include: {
        option: true,
      },
    });

    if (values.length !== optionValueIds.length) {
      throw new BadRequestException(
        'One or more variant option values are invalid',
      );
    }

    const optionIds = new Set(values.map((item) => item.optionId));

    if (optionIds.size !== values.length) {
      throw new BadRequestException(
        'A variant can contain only one value from each option',
      );
    }

    return values;
  }

  async createProduct(dto: CreateProductDto) {
    const existingSlug = await this.prisma.write.product.findUnique({
      where: {
        slug: dto.slug,
      },
      select: {
        id: true,
      },
    });

    if (existingSlug) {
      throw new ConflictException(`Product slug "${dto.slug}" already exists`);
    }

    if (dto.sku) {
      const existingSku = await this.prisma.write.product.findUnique({
        where: {
          sku: dto.sku,
        },
        select: {
          id: true,
        },
      });

      if (existingSku) {
        throw new ConflictException(`Product SKU "${dto.sku}" already exists`);
      }
    }

    await this.validateCategories(dto.categoryIds, dto.subCategoryIds);

    await this.validateOptionInput(dto.options);

    return this.prisma.write.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug.trim(),
          sku: dto.sku?.trim() || null,
          baseImage: dto.baseImage,
          description: dto.description,
          isNew: dto.isNew ?? true,
          isFeatured: dto.isFeatured ?? false,
          isBestSeller: dto.isBestSeller ?? false,
          isActive: dto.isActive ?? true,
          categories: {
            create: dto.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
          subCategories: dto.subCategoryIds?.length
            ? {
                create: dto.subCategoryIds.map((subCategoryId) => ({
                  subCategoryId,
                })),
              }
            : undefined,
        },
      });

      const createdOptions: any[] = [];
      const optionValueLookup = new Map<
        string,
        { id: string; optionName: string; value: string }
      >();

      if (dto.options?.length) {
        for (const optionDto of dto.options) {
          const option = await tx.productOption.create({
            data: {
              productId: product.id,
              name: optionDto.name.trim(),
              productOptionValues: {
                create: optionDto.values.map((value) => ({
                  value: value.value.trim(),
                  metadata: value.metadata,
                })),
              },
            },
            include: {
              productOptionValues: true,
            },
          });

          createdOptions.push(option);

          for (const pov of option.productOptionValues) {
            const lookupKey = `${this.normalize(option.name)}:${this.normalize(pov.value)}`;
            optionValueLookup.set(lookupKey, {
              id: pov.id,
              optionName: option.name,
              value: pov.value,
            });
          }
        }
      }

      const variants = dto.variants ?? [];

      if (!variants.length) {
        if (createdOptions.length) {
          throw new BadRequestException(
            'Variants are required when product options are provided',
          );
        }

        const defaultSku = dto.sku?.trim() || this.generateDefaultSku();

        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: defaultSku,
            images: dto.baseImage ? [dto.baseImage] : [],
            combinationKey: 'default',
          },
        });
      } else {
        const skuSet = new Set<string>();
        const combinationSet = new Set<string>();

        for (const variantDto of variants) {
          const sku = variantDto.sku.trim();

          if (skuSet.has(this.normalize(sku))) {
            throw new ConflictException(`Duplicate variant SKU: ${sku}`);
          }

          skuSet.add(this.normalize(sku));

          let resolvedOptionValues: Array<{
            id: string;
            option: { name: string };
            value: string;
          }> = [];

          if (
            variantDto.options &&
            Object.keys(variantDto.options).length > 0
          ) {
            for (const [optName, optVal] of Object.entries(
              variantDto.options,
            )) {
              const lookupKey = `${this.normalize(optName)}:${this.normalize(optVal)}`;
              const found = optionValueLookup.get(lookupKey);

              if (!found) {
                throw new BadRequestException(
                  `Invalid option value "${optVal}" for option "${optName}" in variant "${sku}"`,
                );
              }

              resolvedOptionValues.push({
                id: found.id,
                option: { name: found.optionName },
                value: found.value,
              });
            }
          } else if (variantDto.optionValueIds?.length) {
            const values = await tx.productOptionValue.findMany({
              where: {
                id: {
                  in: variantDto.optionValueIds,
                },
                option: {
                  productId: product.id,
                },
              },
              include: {
                option: true,
              },
            });

            resolvedOptionValues = values;
          }

          if (
            createdOptions.length &&
            resolvedOptionValues.length !== createdOptions.length
          ) {
            throw new BadRequestException(
              `Variant "${sku}" must have exactly one value from every option`,
            );
          }

          const combinationKey = this.buildCombinationKey(resolvedOptionValues);

          if (combinationSet.has(combinationKey)) {
            throw new ConflictException(
              `Duplicate variant combination: ${combinationKey}`,
            );
          }

          combinationSet.add(combinationKey);

          await tx.productVariant.create({
            data: {
              productId: product.id,
              sku,
              images: variantDto.images ?? [],
              combinationKey,
              productVariantValues: {
                create: resolvedOptionValues.map((value) => ({
                  optionValueId: value.id,
                })),
              },
            },
          });
        }
      }

      return tx.product.findUnique({
        where: {
          id: product.id,
        },
        include: this.productInclude,
      });
    });
  }

  async getProducts(query: GetProductsQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId
        ? {
            categories: {
              some: {
                categoryId: query.categoryId,
              },
            },
          }
        : {}),
      ...(query.subCategoryId
        ? {
            subCategories: {
              some: {
                subCategoryId: query.subCategoryId,
              },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                slug: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                sku: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.isNew !== undefined
        ? {
            isNew: query.isNew,
          }
        : {}),
      ...(query.isBestSeller !== undefined
        ? {
            isBestSeller: query.isBestSeller,
          }
        : {}),
      ...(query.isFeatured !== undefined
        ? {
            isFeatured: query.isFeatured,
          }
        : {}),
      ...(query.isActive !== undefined
        ? {
            isActive: query.isActive,
          }
        : {}),
      ...(query.option && query.optionValue
        ? {
            productOptions: {
              some: {
                name: {
                  equals: query.option,
                  mode: 'insensitive',
                },
                productOptionValues: {
                  some: {
                    value: {
                      equals: query.optionValue,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sortBy === 'oldest'
        ? { createdAt: 'asc' }
        : query.sortBy === 'name-asc'
          ? { name: 'asc' }
          : query.sortBy === 'name-desc'
            ? { name: 'desc' }
            : query.sortBy === 'rating-high'
              ? { averageRating: 'desc' }
              : query.sortBy === 'rating-low'
                ? { averageRating: 'asc' }
                : { createdAt: 'desc' };

    const execute = async (client: PrismaService['read']) => {
      const [items, total] = await Promise.all([
        client.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: this.productInclude,
        }),
        client.product.count({
          where,
        }),
      ]);

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    };

    return this.readWithFallback(
      () => execute(this.prisma.read),
      () => execute(this.prisma.write),
      (result) => result.items.length === 0,
    );
  }

  async getProductBySlug(slug: string) {
    return this.readWithFallback(
      () =>
        this.prisma.read.product.findUnique({
          where: {
            slug,
          },
          include: this.productInclude,
        }),
      () =>
        this.prisma.write.product.findUnique({
          where: {
            slug,
          },
          include: this.productInclude,
        }),
      (product) => !product,
    ).then((product) => {
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    });
  }

  async getProductById(id: string) {
    return this.readWithFallback(
      () =>
        this.prisma.read.product.findUnique({
          where: {
            id,
          },
          include: this.productInclude,
        }),
      () =>
        this.prisma.write.product.findUnique({
          where: {
            id,
          },
          include: this.productInclude,
        }),
      (product) => !product,
    ).then((product) => {
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.write.product.findUnique({
      where: {
        id,
      },
      include: {
        productOptions: {
          include: {
            productOptionValues: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.write.product.findUnique({
        where: {
          slug: dto.slug,
        },
        select: {
          id: true,
        },
      });

      if (slugExists && slugExists.id !== id) {
        throw new ConflictException(
          `Product slug "${dto.slug}" already exists`,
        );
      }
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const skuExists = await this.prisma.write.product.findUnique({
        where: {
          sku: dto.sku,
        },
        select: {
          id: true,
        },
      });

      if (skuExists && skuExists.id !== id) {
        throw new ConflictException(`Product SKU "${dto.sku}" already exists`);
      }
    }

    if (dto.categoryIds) {
      await this.validateCategories(dto.categoryIds, dto.subCategoryIds);
    } else if (dto.subCategoryIds) {
      const existingCategoryIds =
        await this.prisma.write.productCategory.findMany({
          where: {
            productId: id,
          },
          select: {
            categoryId: true,
          },
        });

      await this.validateCategories(
        existingCategoryIds.map((item) => item.categoryId),
        dto.subCategoryIds,
      );
    }

    await this.validateOptionInput(dto.options);

    return this.prisma.write.$transaction(async (tx) => {
      await tx.product.update({
        where: {
          id,
        },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku.trim() || null } : {}),
          ...(dto.baseImage !== undefined ? { baseImage: dto.baseImage } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.isNew !== undefined ? { isNew: dto.isNew } : {}),
          ...(dto.isFeatured !== undefined
            ? { isFeatured: dto.isFeatured }
            : {}),
          ...(dto.isBestSeller !== undefined
            ? { isBestSeller: dto.isBestSeller }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      if (dto.categoryIds) {
        await tx.productCategory.deleteMany({
          where: {
            productId: id,
          },
        });

        await tx.productCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            productId: id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (dto.subCategoryIds) {
        await tx.productSubCategory.deleteMany({
          where: {
            productId: id,
          },
        });

        await tx.productSubCategory.createMany({
          data: dto.subCategoryIds.map((subCategoryId) => ({
            productId: id,
            subCategoryId,
          })),
          skipDuplicates: true,
        });
      }

      if (dto.options !== undefined || dto.variants !== undefined) {
        await tx.productVariantValue.deleteMany({
          where: {
            productVariant: {
              productId: id,
            },
          },
        });

        await tx.productVariant.deleteMany({
          where: {
            productId: id,
          },
        });

        await tx.productOption.deleteMany({
          where: {
            productId: id,
          },
        });

        const createdOptions: any[] = [];
        const optionValueLookup = new Map<
          string,
          { id: string; optionName: string; value: string }
        >();

        if (dto.options?.length) {
          for (const optionDto of dto.options) {
            const option = await tx.productOption.create({
              data: {
                productId: id,
                name: optionDto.name.trim(),
                productOptionValues: {
                  create: optionDto.values.map((value) => ({
                    value: value.value.trim(),
                    metadata: value.metadata,
                  })),
                },
              },
              include: {
                productOptionValues: true,
              },
            });

            createdOptions.push(option);

            for (const pov of option.productOptionValues) {
              const lookupKey = `${this.normalize(option.name)}:${this.normalize(pov.value)}`;
              optionValueLookup.set(lookupKey, {
                id: pov.id,
                optionName: option.name,
                value: pov.value,
              });
            }
          }
        }

        const variants = dto.variants ?? [];

        if (!variants.length) {
          if (!createdOptions.length) {
            const product = await tx.product.findUnique({
              where: { id },
              select: { sku: true, baseImage: true },
            });

            await tx.productVariant.create({
              data: {
                productId: id,
                sku: product?.sku?.trim() || this.generateDefaultSku(),
                images: product?.baseImage ? [product.baseImage] : [],
                combinationKey: 'default',
              },
            });
          }
        } else {
          const skuSet = new Set<string>();
          const combinationSet = new Set<string>();

          for (const variantDto of variants) {
            const sku = variantDto.sku.trim();

            if (skuSet.has(this.normalize(sku))) {
              throw new ConflictException(`Duplicate variant SKU: ${sku}`);
            }

            skuSet.add(this.normalize(sku));

            let resolvedOptionValues: Array<{
              id: string;
              option: { name: string };
              value: string;
            }> = [];

            if (
              variantDto.options &&
              Object.keys(variantDto.options).length > 0
            ) {
              for (const [optName, optVal] of Object.entries(
                variantDto.options,
              )) {
                const lookupKey = `${this.normalize(optName)}:${this.normalize(optVal)}`;
                const found = optionValueLookup.get(lookupKey);

                if (!found) {
                  throw new BadRequestException(
                    `Invalid option value "${optVal}" for option "${optName}" in variant "${sku}"`,
                  );
                }

                resolvedOptionValues.push({
                  id: found.id,
                  option: { name: found.optionName },
                  value: found.value,
                });
              }
            } else if (variantDto.optionValueIds?.length) {
              const values = await tx.productOptionValue.findMany({
                where: {
                  id: {
                    in: variantDto.optionValueIds,
                  },
                  option: {
                    productId: id,
                  },
                },
                include: {
                  option: true,
                },
              });

              resolvedOptionValues = values;
            }

            if (
              createdOptions.length &&
              resolvedOptionValues.length !== createdOptions.length
            ) {
              throw new BadRequestException(
                `Variant "${sku}" must have exactly one value from every option`,
              );
            }

            const combinationKey =
              this.buildCombinationKey(resolvedOptionValues);

            if (combinationSet.has(combinationKey)) {
              throw new ConflictException(
                `Duplicate variant combination: ${combinationKey}`,
              );
            }

            combinationSet.add(combinationKey);

            await tx.productVariant.create({
              data: {
                productId: id,
                sku,
                images: variantDto.images ?? [],
                combinationKey,
                productVariantValues: {
                  create: resolvedOptionValues.map((value) => ({
                    optionValueId: value.id,
                  })),
                },
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: {
          id,
        },
        include: this.productInclude,
      });
    });
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.write.product.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.write.product.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Product deleted successfully',
    };
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    const product = await this.prisma.write.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        productOptions: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingSku = await this.prisma.write.productVariant.findUnique({
      where: {
        sku: dto.sku,
      },
      select: {
        id: true,
      },
    });

    if (existingSku) {
      throw new ConflictException(`Variant SKU "${dto.sku}" already exists`);
    }

    const optionValueIds = dto.optionValueIds ?? [];

    if (
      product.productOptions.length &&
      optionValueIds.length !== product.productOptions.length
    ) {
      throw new BadRequestException(
        'Variant must have exactly one value from every product option',
      );
    }

    const values = await this.resolveVariantOptionValues(
      productId,
      optionValueIds,
    );

    const combinationKey = this.buildCombinationKey(values);

    const existingCombination =
      await this.prisma.write.productVariant.findFirst({
        where: {
          productId,
          combinationKey,
        },
        select: {
          id: true,
        },
      });

    if (existingCombination) {
      throw new ConflictException('This variant combination already exists');
    }

    return this.prisma.write.productVariant.create({
      data: {
        productId,
        sku: dto.sku.trim(),
        images: dto.images ?? [],
        combinationKey,
        productVariantValues: {
          create: values.map((value) => ({
            optionValueId: value.id,
          })),
        },
      },
      include: {
        productVariantValues: {
          include: {
            optionValue: {
              include: {
                option: true,
              },
            },
          },
        },
      },
    });
  }

  async updateVariant(id: string, dto: UpdateVariantDto) {
    const existing = await this.prisma.write.productVariant.findUnique({
      where: {
        id,
      },
      include: {
        product: {
          include: {
            productOptions: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Variant not found');
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const skuExists = await this.prisma.write.productVariant.findUnique({
        where: {
          sku: dto.sku,
        },
        select: {
          id: true,
        },
      });

      if (skuExists && skuExists.id !== id) {
        throw new ConflictException(`Variant SKU "${dto.sku}" already exists`);
      }
    }

    let combinationKey = existing.combinationKey;
    let optionValueIds: string[] | undefined;

    if (dto.optionValueIds !== undefined) {
      optionValueIds = dto.optionValueIds;

      if (
        existing.product.productOptions.length &&
        optionValueIds.length !== existing.product.productOptions.length
      ) {
        throw new BadRequestException(
          'Variant must have exactly one value from every product option',
        );
      }

      const values = await this.resolveVariantOptionValues(
        existing.productId,
        optionValueIds,
      );

      combinationKey = this.buildCombinationKey(values);

      const duplicate = await this.prisma.write.productVariant.findFirst({
        where: {
          productId: existing.productId,
          combinationKey,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicate) {
        throw new ConflictException('This variant combination already exists');
      }
    }

    return this.prisma.write.$transaction(async (tx) => {
      if (optionValueIds !== undefined) {
        await tx.productVariantValue.deleteMany({
          where: {
            productVariantId: id,
          },
        });
      }

      return tx.productVariant.update({
        where: {
          id,
        },
        data: {
          ...(dto.sku !== undefined
            ? {
                sku: dto.sku.trim(),
              }
            : {}),
          ...(dto.images !== undefined
            ? {
                images: dto.images,
              }
            : {}),
          ...(optionValueIds !== undefined
            ? {
                combinationKey,
                productVariantValues: {
                  create: optionValueIds.map((optionValueId) => ({
                    optionValueId,
                  })),
                },
              }
            : {}),
        },
        include: {
          productVariantValues: {
            include: {
              optionValue: {
                include: {
                  option: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async deleteVariant(id: string) {
    const variant = await this.prisma.write.productVariant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.prisma.write.productVariant.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Variant deleted successfully',
    };
  }

  async getVariantsByProduct(productId: string) {
    const execute = (client: PrismaService['read']) =>
      client.productVariant.findMany({
        where: {
          productId,
        },
        orderBy: {
          combinationKey: 'asc',
        },
        include: {
          productVariantValues: {
            include: {
              optionValue: {
                include: {
                  option: true,
                },
              },
            },
          },
        },
      });

    return this.readWithFallback(
      () => execute(this.prisma.read),
      () =>
        this.prisma.write.productVariant.findMany({
          where: {
            productId,
          },
          orderBy: {
            combinationKey: 'asc',
          },
          include: {
            productVariantValues: {
              include: {
                optionValue: {
                  include: {
                    option: true,
                  },
                },
              },
            },
          },
        }),
      (variants) => variants.length === 0,
    );
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.write.category.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: dto.slug }],
      },
    });

    if (existing) {
      throw new ConflictException('Category name or slug already exists');
    }

    return this.prisma.write.category.create({
      data: dto,
    });
  }

  async getCategories(query: PaginationQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const execute = async (client: PrismaService['read']) => {
      const [items, total] = await Promise.all([
        client.category.findMany({
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
          include: {
            subCategories: true,
          },
        }),
        client.category.count(),
      ]);

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    };

    return this.readWithFallback(
      () => execute(this.prisma.read),
      () => execute(this.prisma.write),
      (result) => result.items.length === 0,
    );
  }

  async getCategoryById(id: string) {
    return this.readWithFallback(
      () =>
        this.prisma.read.category.findUnique({
          where: { id },
          include: {
            subCategories: true,
          },
        }),
      () =>
        this.prisma.write.category.findUnique({
          where: { id },
          include: {
            subCategories: true,
          },
        }),
      (category) => !category,
    ).then((category) => {
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    });
  }

  async updateCategory(id: string, dto: CreateCategoryDto) {
    await this.getCategoryById(id);

    return this.prisma.write.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategories(id: string) {
    await this.getCategoryById(id);

    await this.prisma.write.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
    };
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    const category = await this.prisma.write.category.findUnique({
      where: {
        id: dto.categoryId,
      },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const existing = await this.prisma.write.subCategory.findFirst({
      where: {
        OR: [
          {
            name: dto.name,
          },
          {
            slug: dto.slug,
          },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Subcategory name or slug already exists');
    }

    return this.prisma.write.subCategory.create({
      data: dto,
    });
  }

  async getSubCategories(query: PaginationQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const execute = async (client: PrismaService['read']) => {
      const [items, total] = await Promise.all([
        client.subCategory.findMany({
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
          include: {
            category: true,
          },
        }),
        client.subCategory.count(),
      ]);

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    };

    return this.readWithFallback(
      () => execute(this.prisma.read),
      () => execute(this.prisma.write),
      (result) => result.items.length === 0,
    );
  }

  async getSubCategoryById(id: string) {
    return this.readWithFallback(
      () =>
        this.prisma.read.subCategory.findUnique({
          where: { id },
          include: {
            category: true,
          },
        }),
      () =>
        this.prisma.write.subCategory.findUnique({
          where: { id },
          include: {
            category: true,
          },
        }),
      (subcategory) => !subcategory,
    ).then((subcategory) => {
      if (!subcategory) {
        throw new NotFoundException('Subcategory not found');
      }

      return subcategory;
    });
  }

  async updateSubCategory(id: string, dto: CreateSubCategoryDto) {
    await this.getSubCategoryById(id);

    const category = await this.prisma.write.category.findUnique({
      where: {
        id: dto.categoryId,
      },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    return this.prisma.write.subCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSubCategories(id: string) {
    await this.getSubCategoryById(id);

    await this.prisma.write.subCategory.delete({
      where: { id },
    });

    return {
      message: 'Subcategory deleted successfully',
    };
  }

  async getCouponEligibility(productIds: string[]) {
    if (!productIds?.length) {
      return [];
    }

    return this.readWithFallback(
      () =>
        this.prisma.read.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
          select: {
            id: true,
            categories: {
              select: {
                categoryId: true,
              },
            },
          },
        }),
      () =>
        this.prisma.write.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
          select: {
            id: true,
            categories: {
              select: {
                categoryId: true,
              },
            },
          },
        }),
      (products) => products.length === 0,
    );
  }
}
