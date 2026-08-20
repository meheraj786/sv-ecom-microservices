import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationQueryDto } from '../product/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('review')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    const { userId, name } = req.user;
    return this.reviewService.createReview(userId, name || 'Anonymous', dto);
  }

  @Get('product/:productId')
  getReviewsByProduct(
    @Param('productId') productId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewService.getReviewsByProduct(productId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateReview(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const userId = req.user.userId;
    return this.reviewService.updateReview(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteReview(@Req() req: any, @Param('id') id: string) {
    const { userId, role } = req.user;
    return this.reviewService.deleteReview(id, userId, role);
  }
}
