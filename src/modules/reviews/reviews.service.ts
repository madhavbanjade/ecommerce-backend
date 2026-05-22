import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { PrismaService } from '../../prisma.service.js';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import { ApiResponse, SuccessResponseHandler } from '../../common/handlers/success-response.handler.js';
import { Review } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<ApiResponse<Review>> {
    return ErrorHandler.execute(async () => {
      // prevent duplicate review for same product
      const existing = await this.prisma.review.findFirst({
        where: { productId: createReviewDto.productId, UserId: userId },
      });
      if (existing) throw ErrorHandler.invalidCredentials('You have already reviewed this product');

      const review = await this.prisma.review.create({
        data: {
          rating:  createReviewDto.rating,
          title:   createReviewDto.title,
          comment: createReviewDto.comment,
          product: { connect: { id: createReviewDto.productId } },
          user:    { connect: { id: userId } },
        },
        include: { user: { select: { id: true, username: true } } },
      });

      return SuccessResponseHandler.created('Review', review);
    }, 'ReviewService.create');
  }

  async findAll(): Promise<ApiResponse<Review[]>> {
    return ErrorHandler.execute(async () => {
      const reviews = await this.prisma.review.findMany({
        include: {
          user:    { select: { id: true, username: true } },
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return SuccessResponseHandler.retrived('Reviews', reviews);
    }, 'ReviewService.findAll');
  }

  async getProductReviews(productId: string, page = 1, limit = 10): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where: { productId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, username: true } } },
        }),
        this.prisma.review.count({ where: { productId } }),
      ]);

      const avg = total ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      const counts = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.rating === star).length;
        return { star, count, percentage: total ? Math.round((count / total) * 100) : 0 };
      });

      return SuccessResponseHandler.retrived('Reviews', {
        reviews,
        summary: { avg: Math.round(avg * 10) / 10, total, counts },
      });
    }, 'ReviewService.getProductReviews');
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<ApiResponse<Review>> {
    return ErrorHandler.execute(async () => {
      const review = await this.prisma.review.findUnique({ where: { id } });
      if (!review) throw ErrorHandler.notFound('Review');
      if (review.UserId !== userId) throw ErrorHandler.unauthorized('You can only edit your own reviews');

      const updated = await this.prisma.review.update({
        where: { id },
        data: { ...updateReviewDto },
      });
      return SuccessResponseHandler.updated('Review', updated);
    }, 'ReviewService.update');
  }

  async remove(id: string, userId: string): Promise<ApiResponse<Review>> {
    return ErrorHandler.execute(async () => {
      const review = await this.prisma.review.findUnique({ where: { id } });
      if (!review) throw ErrorHandler.notFound('Review');
      if (review.UserId !== userId) throw ErrorHandler.unauthorized('You can only delete your own reviews');

      const deleted = await this.prisma.review.delete({ where: { id } });
      return SuccessResponseHandler.deleted('Review', deleted);
    }, 'ReviewService.remove');
  }
}
