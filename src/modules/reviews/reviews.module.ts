import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { PrismaService } from '../../prisma.service.js';
import { JwtService } from '@nestjs/jwt';


@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService, JwtService],
})
export class ReviewsModule {}
