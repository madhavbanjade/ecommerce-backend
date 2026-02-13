import { Size } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateSizeDto {
  @IsEnum(Size, {
    message: 'Size must be one of sm, md, lg, xl, xxl, xxxl, 4xl',
  })
  size: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock_quantity: number;
}

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'Product Name must be at least 3 characters long' })
  @MaxLength(40, { message: 'Product Name not exceed 30 characters' })
  product_name: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(500)
  product_description: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  original_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discount_percentage?: number;

  @IsArray()
  @IsString()
  @IsOptional()
  images?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSizeDto)
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  sizes: CreateSizeDto[];

  @IsString()
  badge: string;
}
