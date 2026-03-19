import { Body, Injectable, Query, UploadedFile } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { PrismaService } from '../../prisma.service.js';
import { Gender, Product } from '@prisma/client';
import {
  ApiResponse,
  SuccessResponseHandler,
} from '../../common/handlers/success-response.handler.js';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import type { Request } from 'express';
import { default as slugify } from 'slugify';

export function calculateTotalQuantity(
  sizes?: { stockQuantity: number }[],
  fallback = 0,
): number {
  return sizes ? sizes.reduce((sum, s) => sum + s.stockQuantity, 0) : fallback;
}

export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent?: number | null,
): number | null {
  if (discountPercent == null) return null;
  return originalPrice - (originalPrice * discountPercent) / 100;
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
      const {
        name,
        sizes,
        gender,
        discountPercent,
        originalPrice,
        category, // array of categories: [{name: "T-Shirts"}, ...]
        ...rest
      } = createProductDto;

      // 1️⃣ Generate slug from product name
      const slug = (slugify as any).default(name, {
        lower: true,
        strict: true,
      });

      // 2️⃣ Calculate total stock quantity
      const totalQuantity = calculateTotalQuantity(sizes);

      // 3️⃣ Calculate discounted price
      const discountPrice = calculateDiscountedPrice(
        originalPrice,
        discountPercent,
      );

      // 4️⃣ Prepare image paths
      const imagePaths = files.map((file) => `/uploads/image/${file.filename}`);

      // 5️⃣ Create product in DB
      const createProduct = await this.prisma.product.create({
        data: {
          ...rest,
          name,
          slug,
          gender: gender as Gender,
          images: imagePaths,
          originalPrice: originalPrice,
          discountPercent: discountPercent,
          dicountPrice: discountPrice,
          isAvilable: totalQuantity > 0, // true if any stock
          //  Link categories properly
          category: {
            create: category.map((c) => ({
              name: c.name as any,
            })),
          },
          // 5b️⃣ Create sizes
          sizes: {
            create: sizes.map((s) => ({
              size: s.size as any,
              stockQuantity: s.stockQuantity,
            })),
          },
        },
        include: {
          sizes: true,
          category: true,
        },
      });

      // 6️⃣ Return success response
      return SuccessResponseHandler.created(
        'Product',
        this.transformProduct(createProduct, req),
      );
    }, 'ProductsService.create');
  }

  async filterProduct(req: Request): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      const { tag, gender, category, size, sort, search, page, limit } =
        req.query as any;
      const where: any = {};
      //filters
      //tag
      if (tag) {
        where.tag = tag;
      }

      if (gender) {
        where.gender = gender;
      }

      //category - it is a relation so we should use some
      if (category) {
        const categoryArr = category.split(',');

        where.category = {
          some: {
            name: { in: categoryArr },
          },
        };
      }

      //for search
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tag: { contains: search, mode: 'insensitive' } },
        ];
      }

      //size - it is a relation so we should use some
      if (size) {
        const sizeArr = size.split(',');
        where.sizes = {
          some: {
            size: { in: sizeArr },
          },
        };
      }

      //sorting
      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price-asc') orderBy = { originalPrice: 'asc' }; // ?sort=price-asc    → cheapest first
      if (sort === 'price-desc') orderBy = { originalPrice: 'desc' }; // ?sort=price-desc   → most expensive first
      if (sort === 'discount') orderBy = { discountPercent: 'desc' }; // ?sort=discount     → highest discount first

      //pagination
      const take = parseInt(limit) || 12; //if limit is missing, invalid, or NaN, default to 12 items per page
      const currentPage = parseInt(page) || 1; //page = "2" → currentPage = 2, page = undefined → currentPage = 1
      const skip = (currentPage - 1) * take; //how many items to ignore before starting

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            sizes: true,
            category: true,
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return SuccessResponseHandler.retrived(
        'Products',
        products.map((p) => this.transformProduct(p, req)), // ✅ actual data
        {
          total,
          page: currentPage,
          limit: take,
          totalPages: Math.ceil(total / take),
          hasNext: currentPage < Math.ceil(total / take),
          hasPrev: currentPage > 1,
        },
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
          category: true,
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

  // async update(
  //   id: number,
  //   @Body() updateProductDto: UpdateProductDto,
  //   files: Express.Multer.File[],
  // ): Promise<ApiResponse<Product>> {
  //   return ErrorHandler.execute(async () => {
  //     const { sizes, removeImages, originalPrice, discountPercent, ...rest } =
  //       updateProductDto;

  //     // fetch existing product (needed for calculations)
  //     const existing = await this.prisma.product.findUnique({
  //       where: { id },
  //       include: { sizes: true },
  //     });

  //     if (!existing) {
  //       throw ErrorHandler.notFound(`Product with id ${id}`);
  //     }
  //     const finalOriginalPrice = originalPrice ?? existing.originalPrice;

  //     const finalDiscountPercentage =
  //       discountPercent !== undefined
  //         ? discountPercent
  //         : existing.discountPercent;

  //     const discountPrice = calculateDiscountedPrice(
  //       finalOriginalPrice,
  //       finalDiscountPercentage,
  //     );

  //     //track images
  //     let finalImages = existing.images;
  //     //remove images
  //     if (removeImages?.length) {
  //       finalImages = finalImages.filter((img) => !removeImages.includes(img));
  //     }

  //     // Maximum allowed images

  //     const MAX_IMAGES = 4;

  //     // Check if adding these files would exceed the limit
  //     if (files?.length && finalImages.length + files.length <= MAX_IMAGES) {
  //       const newImagesPath = files.map(
  //         (file) => `/uploads/image/${file.filename}`,
  //       );
  //       finalImages.push(...newImagesPath);
  //     } else {
  //       console.log('Cannot add more images. Maximum of 4 reached.');
  //       // Or return an error to the client, e.g.:
  //       // res.status(400).json({ message: "Maximum 4 images allowed." });
  //     }

  //     const product = await this.prisma.product.update({
  //       where: { id },
  //       data: {
  //         ...rest,
  //         images: finalImages,
  //         ...(originalPrice !== undefined && { originalPrice }),
  //         ...(discountPercent !== undefined && { discountPercent }),

  //         ...(sizes && {
  //           sizes: {
  //             deleteMany: {},
  //             create: sizes.map((s) => ({
  //               size: s.size as any,
  //               stock_quantity: s.stockQuantity,
  //             })),
  //           },
  //         }),
  //       },
  //       include: {
  //         sizes: true,
  //       },
  //     });

  //     return SuccessResponseHandler.updated('Product', product);
  //   }, 'ProductsService.update');
  // }

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
