import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../../prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ProductsController } from './products.controller.js';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, JwtService],
  exports:[ProductsService]
})
export class ProductsModule {}
