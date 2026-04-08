import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { ProtectLoginGuard } from '../../common/guards/protect-login.guard.js';
import { RoleProtectGuard } from '../../common/guards/roles.guard.js';


@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}


  @UseGuards(ProtectLoginGuard)
  @Post()
  createOrder(@Req() req: any) {
    const userId = req.user?.id
    console.log("userId-from-order", userId)
    return this.ordersService.createOrder(userId);
  }

  @UseGuards(ProtectLoginGuard)
  @Get()
  getUserOrders(@Query("tab") tab:string = "active", @Req() req: any) {
    const userId = req.user?.id
    return this.ordersService.getUserOrders(userId, tab);
  }

  @UseGuards(ProtectLoginGuard)
  @Get(':id')
  getOrderById(@Param('id') id: string, @Req() req:any) {
      console.log("orderId from param:", id)
        const isAdmin = req.user.role === 'admin';
     return this.ordersService.getOrderById(id, req.user.id, isAdmin);
  }
 
  @UseGuards(ProtectLoginGuard, RoleProtectGuard)
  @Patch(':id/status')
  updateOrderStatus(@Param('id') id: string,  @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.updateOrderStatus(id, updateOrderDto);
  }

  @UseGuards(ProtectLoginGuard)
  @Delete(':id')
  cancelPOrder(@Param('id') id: string, @Req() req:any) {
    const userId = req.user?.id
    return this.ordersService.cancelOrder(id, userId);
  }
}
