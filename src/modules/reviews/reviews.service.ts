import { Body, Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { PrismaService } from '../../prisma.service.js';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import {
  ApiResponse,
  SuccessResponseHandler,
} from '../../common/handlers/success-response.handler.js';
import { Review } from '@prisma/client';
import { UpdateReviewDto } from './dto/update-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    @Body() createReviewDto: CreateReviewDto, userId: string
  ): Promise<ApiResponse<Review>> {
    return ErrorHandler.execute(async () => {
      const review = await this.prisma.review.create({
        data: {
          productId: createReviewDto.productId,
          UserId: userId,
          rating: createReviewDto.rating,
          title: createReviewDto.title,
          comment: createReviewDto.comment,
        },
      });
      return SuccessResponseHandler.created('Review', review);
    }, 'ReviewService.create');
  }


async update(
  id: string,
  updateReviewDto: UpdateReviewDto,
): Promise<ApiResponse<Review>> {
  return ErrorHandler.execute(async () => {
    const review = await this.prisma.review.update({
      where: { id },
      data: { ...updateReviewDto },
    })
    return SuccessResponseHandler.updated("Review", review)
  }, "ReviewService.update")
}

async remove(
  id: string,
): Promise<ApiResponse<Review>> {
  return ErrorHandler.execute(async () => {
    const review = await this.prisma.review.delete({
      where: { id },
    })
    return SuccessResponseHandler.updated("Review", review)
  }, "ReviewService.delete")
}


async getProductReviews(productId: string, page = 1, limit = 10): Promise<ApiResponse<any>> {
  return ErrorHandler.execute(async () => {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId: (productId) },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.review.count({
        where: { productId: (productId) },
      }),
    ])

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / (total || 1)

    const counts = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length
      return {
        star,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      }
    })

    return SuccessResponseHandler.retrived("Reviews", {
      reviews,
      summary: {
        avg: Math.round(avg * 10) / 10,
        total,
        counts,
      },
    })
  }, "ReviewService.getProductReviews")
}




  findAll() {
    return `This action returns all reviews`;
  }

 
}
