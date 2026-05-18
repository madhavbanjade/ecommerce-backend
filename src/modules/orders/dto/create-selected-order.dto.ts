import { IsArray, IsIn, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class CreateSelectedOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  cartItemIds: string[];

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsIn(['esewa', 'khalti', 'cash', 'bank'])
  paymentMethod: string;
}
