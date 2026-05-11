import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { ProtectLoginGuard } from '../../common/guards/protect-login.guard.js';
import { RoleProtectGuard } from '../../common/guards/roles.guard.js';
import { CreateOrderDto } from './dto/create-order.dto.js';


@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}


  @UseGuards(ProtectLoginGuard)
  @Post()
  createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.id
    console.log("userId-from-order", userId)
    return this.ordersService.createOrder(userId, dto);
  }

@UseGuards(ProtectLoginGuard)
@Get()
getUserOrders(
  @Query('tab') tab: string = 'active',
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '6',
  @Req() req: any,
) {
  const userId = req.user?.id;
  return this.ordersService.getUserOrders(userId, tab, page, limit);
}
    @UseGuards(ProtectLoginGuard)
    @Get(':id')
    getOrderById(@Param('id') id: string, @Req() req:any) {
       console.log("orderId from param:", id);
  console.log("req.user:", req.user); 
      
      return this.ordersService.getOrderById(id, req.user.id);
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
