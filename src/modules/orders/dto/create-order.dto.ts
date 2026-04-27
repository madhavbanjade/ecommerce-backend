import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class CreateOrderDto {


    @IsString()
    @IsNotEmpty()
    fullName: string

    @IsString()
    @IsNotEmpty()
    phone: string

    @IsString()
    @IsNotEmpty()
    location: string

    @IsString()
    @IsIn(["esewa", "khalti", "cash"])
    paymentMethod: string
}
