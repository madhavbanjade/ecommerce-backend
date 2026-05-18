import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateSingleOrderDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsIn(['sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xl4'])
  size: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsIn(['esewa', 'khalti', 'cash'])
  paymentMethod: string;
}
