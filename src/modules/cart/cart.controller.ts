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

@UseGuards(ProtectLoginGuard)
  @Get("")
  getCartt(@Req() req: any) {
    const userId  = req.user?.id
    return this.cartService.getCart(userId, req);
  }


@UseGuards(ProtectLoginGuard)
  @Patch(':id')
  updateCartItem(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.updateCartItem(id, updateCartDto);
  }

  @UseGuards(ProtectLoginGuard)
  @Delete(':id')
  deleteCartItem(@Param('id') id: string) {
    return this.cartService.deleteCartItem(id);
  }

  @UseGuards(ProtectLoginGuard)
  @Delete('')
  deleteAllCartItem(@Param('id') id: string) {
    return this.cartService.deleteAllCartItem(id);
  }
}
