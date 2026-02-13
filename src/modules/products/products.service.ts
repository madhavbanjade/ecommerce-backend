import { Body, Injectable, Query, UploadedFile } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { PrismaService } from '../../prisma.service.js';
import { Product } from '@prisma/client';
import {
  ApiResponse,
  SuccessResponseHandler,
} from '../../common/handlers/success-response.handler.js';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import type { Request } from 'express';

export function calculateTotalQuantity(
  sizes?: { stock_quantity: number }[],
  fallback = 0,
): number {
  return sizes ? sizes.reduce((sum, s) => sum + s.stock_quantity, 0) : fallback;
}

export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercentage?: number | null,
): number | null {
  if (discountPercentage == null) return null;
  return originalPrice - (originalPrice * discountPercentage) / 100;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  //helper method
  private generateImageUrl(req: Request, path: string): string {
    return `${req.protocol}://${req.get('host')}${path}`;
  }

  private transformProduct(product: any, req: Request): Product {
    return {
      ...product,
      images: product.images.map((img: string) =>
        this.generateImageUrl(req, img),
      ),
    };
  }

  // result.success      // ✅ boolean
  // result.message      // ✅ string
  // result.data         // ✅ Product | undefined

  async create(
    @Body() createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    req: Request,
  ): Promise<ApiResponse<Product>> {
    return ErrorHandler.execute(async () => {
      const { sizes, discount_percentage, original_price, ...rest } =
        createProductDto;
      const quantity = calculateTotalQuantity(sizes);

      const discounted_price = calculateDiscountedPrice(
        original_price,
        discount_percentage,
      );

      const imagePaths = files.map((file) => `/uploads/image/${file.filename}`);

      const createProduct = await this.prisma.product.create({
        data: {
          ...rest,
          images: imagePaths,
          original_price,
          discount_percentage,
          discounted_price,
          quantity,
          is_avilable: quantity > 0,
          sizes: {
            create: sizes.map((s) => ({
              size: s.size as any,
              stock_quantity: s.stock_quantity,
            })),
          },
        },
        include: {
          sizes: true,
        },
      });

      return SuccessResponseHandler.created(
        'Product',
        this.transformProduct(createProduct, req),
      );
    }, 'ProductsService.create');
  }

  async findAll(req: Request): Promise<ApiResponse<Product[]>> {
    return ErrorHandler.execute(async () => {
      const retrivedProducts = await this.prisma.product.findMany({
        include: {
          // this is imp for nested dto to what to show and what not to show
          sizes: true,
        },
      });
      if (retrivedProducts.length === 0)
        throw ErrorHandler.notFound('Products');

      return SuccessResponseHandler.retrived(
        'product',
        retrivedProducts.map((p) => this.transformProduct(p, req)), // ✅ transform all
      );
    }, 'ProductsService.findAll');
  }

  async findOne(id: number, req: Request): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          sizes: true,
        },
      });

      if (!product) {
        throw ErrorHandler.notFound(`Product with id ${id}`);
      }

      return SuccessResponseHandler.retrived(
        'product',
        this.transformProduct(product, req),
      );
    }, 'ProductsService.findOne');
  }

  async update(
    id: number,
    @Body() updateProductDto: UpdateProductDto,
    files: Express.Multer.File[],
  ): Promise<ApiResponse<Product>> {
    return ErrorHandler.execute(async () => {
      const {
        sizes,
        removeImages,
        original_price,
        discount_percentage,
        ...rest
      } = updateProductDto;

      // fetch existing product (needed for calculations)
      const existing = await this.prisma.product.findUnique({
        where: { id },
        include: { sizes: true },
      });

      if (!existing) {
        throw ErrorHandler.notFound(`Product with id ${id}`);
      }
      const finalOriginalPrice = original_price ?? existing.original_price;

      const finalDiscountPercentage =
        discount_percentage !== undefined
          ? discount_percentage
          : existing.discount_percentage;

      const discounted_price = calculateDiscountedPrice(
        finalOriginalPrice,
        finalDiscountPercentage,
      );

      const quantity = calculateTotalQuantity(sizes, existing.quantity);

      //track images
      let finalImages = existing.images;
      //remove images
      if (removeImages?.length) {
        finalImages = finalImages.filter((img) => !removeImages.includes(img));
      }
      //add new images
      if (files?.length) {
        const newImagesPath = files.map(
          (file) => `/uploads/image/${file.filename}`,
        );
        finalImages.push(...newImagesPath);
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...rest,
          images: finalImages,
          ...(original_price !== undefined && { original_price }),
          ...(discount_percentage !== undefined && { discount_percentage }),
          discounted_price,
          quantity,
          is_avilable: quantity > 0,

          ...(sizes && {
            sizes: {
              deleteMany: {},
              create: sizes.map((s) => ({
                size: s.size as any,
                stock_quantity: s.stock_quantity,
              })),
            },
          }),
        },
        include: {
          sizes: true,
        },
      });

      return SuccessResponseHandler.updated('Product', product);
    }, 'ProductsService.update');
  }

  async remove(id: number): Promise<ApiResponse<Product>> {
    return ErrorHandler.execute(async () => {
      const deleteProduct = await this.prisma.product.delete({
        where: { id },
        include: {
          sizes: true,
        },
      });
      return SuccessResponseHandler.deleted('product', deleteProduct);
    }, 'ProductsService.delete');
  }
}
