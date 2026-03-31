import { Body, Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto.js';
import { UpdateCartDto } from './dto/update-cart.dto.js';
import { PrismaService } from '../../prisma.service.js';
import {
  ApiResponse,
  SuccessResponseHandler,
} from '../../common/handlers/success-response.handler.js';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import { error } from 'console';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}


  //product add to cart
  async addToCart(
    createCartDto: CreateCartDto,
    userId: string,
  ): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      // ✅ validate size exists for this product and has stock
      const productSize = await this.prisma.productSize.findUnique({
        where: {
          productId_size: {
            productId: createCartDto.productId,
            size: createCartDto.size,
          },
        },
      });

      if (!productSize)
        throw ErrorHandler.notFound(
          `Size ${createCartDto.size} for this product`,
        );
      if (productSize.stockQuantity < createCartDto.quantity) {
        throw error(
          `Only ${productSize.stockQuantity} items available in size ${createCartDto.size}`,
        );
      }

      // check if same product + size already in cart
      const existing = await this.prisma.cart.findUnique({
        where: {
          userId_productId_size: {
            userId,
            productId: createCartDto.productId,
            size: createCartDto.size,
          },
        },
      });

      if (existing) {
        const updated = await this.prisma.cart.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + createCartDto.quantity },
        });
        return SuccessResponseHandler.updated('Cart', updated);
      }

      const cartItem = await this.prisma.cart.create({
        data: {
          productId: createCartDto.productId,
          size: createCartDto.size,
          quantity: createCartDto.quantity,
          userId,
        },
        include: { product: true },
      });

      return SuccessResponseHandler.created('Cart', cartItem);
    }, 'CartService.addToCart');
  }

  //get cart items
async getCart(userId: string, req: Request): Promise<ApiResponse<any>> {
  return ErrorHandler.execute(async () => {
    const cartItems = await this.prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            images: true,
            name: true,
            originalPrice: true,
            dicountPrice: true,
            slug: true,
            sizes: true, // optional if needed
          },
        },
      },
    });

    const items = await Promise.all(
      cartItems.map(async (item) => {
        const price =
          item.product.dicountPrice ?? item.product.originalPrice;

        // ✅ fetch matching product size
        const productSize = await this.prisma.productSize.findUnique({
          where: {
            productId_size: {
              productId: item.productId,
              size: item.size,
            },
          },
          select: {
            stockQuantity: true,
          },
        });

        return {
          id: item.id,
          size: item.size,
          quantity: item.quantity,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images[0],
          unitPrice: price,
          totalPrice: price * item.quantity,

          // ✅ ADD THIS
          stockQuantity: productSize?.stockQuantity ?? 0,
        };
      })
    );

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return SuccessResponseHandler.retrived('Cart', {
      items,
      totalItems,
      totalPrice,
    });
  }, 'CartService.getCart');
}

  //update cart-items
async updateCartItem(
  id: string,
  updateCartDto: UpdateCartDto,
): Promise<ApiResponse<any>> {
  return ErrorHandler.execute(async () => {
    const { quantity } = updateCartDto;

    if (quantity == null) {
      throw new Error('Quantity is required');
    }

    const existing = await this.prisma.cart.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            sizes: true,
          },
        },
      },
    });

    if (!existing) throw ErrorHandler.notFound('Cart Item');

    const productSize = await this.prisma.productSize.findUnique({
      where: {
        productId_size: {
          productId: existing.productId,
          size: existing.size,
        },
      },
    });

    if (!productSize) throw ErrorHandler.notFound('Product Size');

    const diff = quantity - existing.quantity;

  

    const updated = await this.prisma.$transaction(async (tx) => {
      // ✅ Update cart
      const cart = await tx.cart.update({
        where: { id },
        data: { quantity },
      });

    

      return cart;
    });

    return SuccessResponseHandler.updated('Cart', updated);
  }, 'CartService.updateCart');
}


  //delete one cart item
  async deleteCartItem(id: string): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      const deleteItem = await this.prisma.cart.delete({
        where: { id: id },
      });
      return SuccessResponseHandler.deleted('CartItem', {
        deleteItem,
      });
    }, 'CartService.deleteCart');
  }

  //bulk delete of cart
  async deleteAllCartItem(id: string): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      const deleteAllItem = await this.prisma.cart.deleteMany({
        where: { id: id },
      });
      return SuccessResponseHandler.deleted('CartItem', {
        deleteAllItem,
      });
    }, 'CartService.deleteCart');
  }


}
