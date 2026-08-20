import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationQueryDto } from '../product/dto/pagination-query.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  private async recalculateProductRating(productId: string) {
    const reviews = await this.prisma.write.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = total > 0 ? sum / total : 0;

    await this.prisma.write.product.update({
      where: { id: productId },
      data: { averageRating },
    });
  }

  async createReview(userId: string, userName: string, dto: CreateReviewDto) {
    const product = await this.prisma.read.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new BadRequestException('Product does not exist');
    }

    const existingReview = await this.prisma.read.review.findFirst({
      where: { productId: dto.productId, userId },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = await this.prisma.write.review.create({
      data: {
        productId: dto.productId,
        userId,
        userName,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.recalculateProductRating(dto.productId);
    return review;
  }

  async getReviewsByProduct(productId: string, query: PaginationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      this.prisma.read.review.count({ where: { productId } }),
      this.prisma.read.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        totalReviews: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      reviews,
    };
  }

  async updateReview(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.read.review.findUnique({
      where: { id },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this review',
      );
    }

    const updatedReview = await this.prisma.write.review.update({
      where: { id },
      data: dto,
    });

    await this.recalculateProductRating(review.productId);
    return updatedReview;
  }

  async deleteReview(id: string, userId: string, userRole: string) {
    const review = await this.prisma.read.review.findUnique({
      where: { id },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You are not authorized to delete this review',
      );
    }

    await this.prisma.write.review.delete({
      where: { id },
    });

    await this.recalculateProductRating(review.productId);
    return { message: 'Review deleted successfully' };
  }
}
