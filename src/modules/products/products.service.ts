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
import { default as slugify } from "slugify"


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
      const {product_name, sizes, discount_percentage, original_price, category, ...rest } =
        createProductDto;


        //for slug
        const slug =(slugify as any).default(product_name, {
          lower: true, 
          strict: true
        })
      //for quantity
      const quantity = calculateTotalQuantity(sizes);

      //for discount
      const discounted_price = calculateDiscountedPrice(
        original_price,
        discount_percentage,
      );

      //for files
      const imagePaths = files.map((file) => `/uploads/image/${file.filename}`);

      const createProduct = await this.prisma.product.create({
        data: {
          ...rest,
          product_name: product_name,
          slug: slug,
          images: imagePaths,
          original_price,
          discount_percentage,
          discounted_price,
          quantity,
          category,
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

  async filterProduct(req: Request): Promise<ApiResponse<Product[]>> {
    return ErrorHandler.execute(async () => {
      const { tag, category, sort } =
        req.query as any;
      const where: any = {};
      //filters
      //tag
      if (tag) {
        where.tag = tag;
      }
      //category
      if (category) {
        where.category = category;
      }

      //sorting
      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price_asc') orderBy = { original_price: 'asc' };
      if (sort === 'price_desc') orderBy = { original_price: 'desc' };
      if (sort === 'discount') orderBy = { discount_percentage: 'asc' };
      if (sort === 'newest') orderBy = { createdAt: 'desc' };

      const products = await this.prisma.product.findMany({
        where,
        orderBy,
        include: {
          sizes: true,
        },
      });
      return SuccessResponseHandler.retrived(
        'Products',
        products.map((p) => this.transformProduct(p, req)),
      );
    }, 'Productservice.filterPtroduct');
  }

async findBySlug(slug: string, req: Request): Promise<ApiResponse<any>> {
  return ErrorHandler.execute(async () => {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { sizes: true },
    });

    if (!product) {
      throw ErrorHandler.notFound(`Product with slug "${slug}" not found`);
    }

    return SuccessResponseHandler.retrived(
      'product',
      this.transformProduct(product, req),
    );
  }, 'ProductsService.findBySlug');
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

      // Maximum allowed images

      const MAX_IMAGES = 4;

      // Check if adding these files would exceed the limit
      if (files?.length && finalImages.length + files.length <= MAX_IMAGES) {
        const newImagesPath = files.map(
          (file) => `/uploads/image/${file.filename}`,
        );
        finalImages.push(...newImagesPath);
      } else {
        console.log('Cannot add more images. Maximum of 4 reached.');
        // Or return an error to the client, e.g.:
        // res.status(400).json({ message: "Maximum 4 images allowed." });
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
