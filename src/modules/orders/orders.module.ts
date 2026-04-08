import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../../prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ProductsService } from '../products/products.service.js';


@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, JwtService, ProductsService],
})
export class OrdersModule {}
