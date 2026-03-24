import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  productId: string; // must match model

//   @IsUUID()
//   userId: string; // must match model

  @IsInt()
  @Type(() => Number) 
  rating: number; // use lowercase `number` in TypeScript

  @IsString()
  title: string;

  @IsString()
  comment: string;
}