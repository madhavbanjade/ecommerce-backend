import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { CreateCartDto } from './dto/create-cart.dto.js';
import { UpdateCartDto } from './dto/update-cart.dto.js';
import { ProtectLoginGuard } from '../../common/guards/protect-login.guard.js';


@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(ProtectLoginGuard)
  @Post()
  addToCart(@Body() createCartDto: CreateCartDto, @Req() req:any) {
    const userId = req.user?.id
    console.log("user", userId)
    return this.cartService.addToCart(createCartDto, userId);
  }

  // @Get()
  // findAll() {
  //   return this.cartService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.cartService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
  //   return this.cartService.update(+id, updateCartDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.cartService.remove(+id);
  // }
}
