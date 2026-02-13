import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { RoleProtectGuard } from '../../common/guards/roles.guard.js';
import type { Request, Response } from 'express';
import { setAuthCookies } from '../../common/cookies/auth-cookie.js';
import { ProtectLoginGuard } from '../../common/guards/protect-login.guard.js';

@Controller('users')
export class UsersController {
  //constructor-based injection => providers or services
  constructor(private readonly usersService: UsersService) {}

  @Post('/register')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.login(loginUserDto);
    setAuthCookies(
      req,
      res,
      result.data!.access_token,
      result.data!.refresh_token,
    );
    return result;
  }

  @UseGuards(ProtectLoginGuard, RoleProtectGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(ProtectLoginGuard, RoleProtectGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(ProtectLoginGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(ProtectLoginGuard, RoleProtectGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
