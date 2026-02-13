import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFiles,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProtectLoginGuard } from '../../common/guards/protect-login.guard.js';
import { RoleProtectGuard } from '../../common/guards/roles.guard.js';
import { UploadMultiple } from '../../common/config/multer.config.js';
import type { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(ProtectLoginGuard, RoleProtectGuard)
  @Post('/')
  @UploadMultiple('images', 4)
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return this.productsService.create(createProductDto, files, req);
  }

  @Get('/')
  findAll(@Req() req: Request) {
    return this.productsService.findAll(req);
  }

  @UseGuards(ProtectLoginGuard)
  @Get('/:id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.productsService.findOne(+id, req);
  }

  @UseGuards(ProtectLoginGuard, RoleProtectGuard)
  @Patch(':id')
  @UploadMultiple('images', 4)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.update(id, updateProductDto, files);
  }

  @UseGuards(ProtectLoginGuard, RoleProtectGuard)
  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
