import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { PrismaService } from '../../prisma.service.js';
import { BcryptService } from '../../common/services/bcrypt.service.js';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [UsersController],
  //add all the services used in the module
  providers: [UsersService, PrismaService, BcryptService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}
