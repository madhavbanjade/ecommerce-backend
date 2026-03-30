import { Size } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsUUID, Min } from "class-validator";

export class CreateCartDto {

@IsUUID()
productId: string

@IsEnum(Size)
size : Size

@IsInt()
@Min(1)
@Type(() => Number)
quantity: number

}
