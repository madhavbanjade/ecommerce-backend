import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ProtectLoginGuard } from '../../common/guards/protect-login.guard.js';


@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}



@UseGuards(ProtectLoginGuard)
  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @Req() req:any) {
    const userId = req.user?.sub
    console.log("user", userId)
    return this.reviewsService.create(createReviewDto, userId);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.getProductReviews(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
