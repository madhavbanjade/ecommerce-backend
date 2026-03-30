import { Body, Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto.js';
import { UpdateCartDto } from './dto/update-cart.dto.js';
import { PrismaService } from '../../prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service.js';
import { ApiResponse, SuccessResponseHandler } from '../../common/handlers/success-response.handler.js';
import { Cart } from '@prisma/client';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import { error } from 'console';


@Injectable()
export class CartService {

  constructor(
    private readonly prisma: PrismaService,
   

  ) {}

  async addToCart(createCartDto: CreateCartDto, userId: string): Promise<ApiResponse<any>> {
  return ErrorHandler.execute(async () => {

    // ✅ validate size exists for this product and has stock
    const productSize = await this.prisma.productSize.findUnique({
      where: {
        productId_size: {
          productId: createCartDto.productId,
          size: createCartDto.size,
        }
      }
    })

    if (!productSize) throw ErrorHandler.notFound(`Size ${createCartDto.size} for this product`)
    if (productSize.stockQuantity < createCartDto.quantity) {
      throw error(`Only ${productSize.stockQuantity} items available in size ${createCartDto.size}`)
    }

    // check if same product + size already in cart
    const existing = await this.prisma.cart.findUnique({
      where: {
        userId_productId_size: {
          userId,
          productId: createCartDto.productId,
          size: createCartDto.size,
        }
      }
    })

    if (existing) {
      const updated = await this.prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + createCartDto.quantity }
      })
      return SuccessResponseHandler.updated("Cart", updated)
    }

    const cartItem = await this.prisma.cart.create({
      data: {
        productId: createCartDto.productId,
        size: createCartDto.size,
        quantity: createCartDto.quantity,
        userId,
      },
      include: { product: true }
    })

    return SuccessResponseHandler.created("Cart", cartItem)
  }, "CartService.addToCart")
}




}
