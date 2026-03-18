import { Size } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
  stockQuantity: number;
}

export class CreatCategoryDto {
  @IsString()
  name: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'Product Name must be at least 3 characters long' })
  @MaxLength(40, { message: 'Product Name not exceed 30 characters' })
  name: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(500)
  description: string;

  @IsString()
  gender: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  originalPrice: number;



  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercent?: number;

 @IsArray()
@ValidateNested({ each: true })
@Type(() => CreatCategoryDto)
@Transform(({ value }) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return [{ name: value }];
  }
})
category: CreatCategoryDto[];

  @IsArray()
  @IsString()
  @IsOptional()
  images?: string[];

 

@IsArray()
@ValidateNested({ each: true })
@Type(() => CreateSizeDto)
@Transform(({ value }) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
})
sizes: CreateSizeDto[];

  @IsString()
  @IsOptional()
  tag: string;
}
