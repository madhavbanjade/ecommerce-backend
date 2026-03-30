import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto.js';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartDto extends PartialType(CreateCartDto) {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity?: number | undefined;
}
