import { Module } from '@nestjs/common';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { PrismaService } from '../../prisma.service.js';
import { JwtService } from '@nestjs/jwt';

@Module({
controllers: [CartController],
  providers: [CartService, PrismaService, JwtService],
})
export class CartModule {}
