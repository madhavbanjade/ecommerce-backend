import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../../prisma.service.js';
import { JwtService } from '@nestjs/jwt';


@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, JwtService],
})
export class OrdersModule {}
