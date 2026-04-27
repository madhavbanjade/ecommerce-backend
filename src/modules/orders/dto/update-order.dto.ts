import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto.js';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsEnum(OrderStatus)
  status: OrderStatus | undefined;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean
}
