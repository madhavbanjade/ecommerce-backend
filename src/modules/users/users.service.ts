import { Body, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { PrismaService } from '../../prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ApiResponse,
  SuccessResponseHandler,
} from '../../common/handlers/success-response.handler.js';
import { ErrorHandler } from '../../common/handlers/error.handler.js';
import { Role, User } from '@prisma/client';
import { BcryptService } from '../../common/services/bcrypt.service.js';

interface JwtPayload {
  sub: number;
  name: string;
  email: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<User>> {
    return ErrorHandler.execute(async () => {
      const { name, email, role } = createUserDto;
      const hashedPassword = await this.bcryptService.hashPassword(
        createUserDto.password,
      );
      const created = await this.prisma.user.create({
        data: { name, email, password: hashedPassword, role },
      });
      // console.log('user', created);
      return SuccessResponseHandler.created('User', created);
    }, 'UsersService.create');
  }

  async login(loginUserDto: LoginUserDto): Promise<
    ApiResponse<{
      id: number;
      email: string;
      access_token: string;
      refresh_token: string;
    }>
  > {
    return ErrorHandler.execute(async () => {
      const { name, password } = loginUserDto;

      // 1️⃣ Find user by email
      const user = await this.prisma.user.findUnique({
        where: { name },
      });
      //Error, resource
      if (!user || !user.password) throw ErrorHandler.notFound('User'); //!!!

      // 2️⃣ Compare password
      const isValid = await this.bcryptService.comparePassword(
        password,
        user.password,
      );
      if (!isValid) throw ErrorHandler.invalidCredentials();

      // 3️⃣ Prepare JWT payload
      const payload: JwtPayload = {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      // 4️⃣ Generate access + refresh tokens
      const [access_token, refresh_token] = await Promise.all([
        this.jwtService.signAsync(
          { ...payload },
          {
            secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.getOrThrow('EXPIRES_IN') as any,
          },
        ),
        this.jwtService.signAsync(
          { ...payload },
          {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.getOrThrow(
              'REFRESH_EXPIRES_IN',
            ) as any,
          },
        ),
      ]);
      // console.log('access', access_token);
      // console.log('refresh', refresh_token);

      // 6️⃣ Return safe response (never return password)
      return SuccessResponseHandler.login('User', {
        id: user.id,
        name: user.name,
        email: user.email,
        access_token,
        refresh_token,
      });
    }, 'UsersService.login');
  }

  async findAll(): Promise<ApiResponse<any>> {
    const RetrivedMany = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    return SuccessResponseHandler.retrived('Users', RetrivedMany);
  }

  async findOne(id: number): Promise<ApiResponse<any>> {
    const RetriveOne = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    if (!RetriveOne) {
      throw ErrorHandler.notFound(`User with id ${id}`);
    }
    return SuccessResponseHandler.retrived('User', RetriveOne);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<{ id: number; email: string }>> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return SuccessResponseHandler.updated('User', {
        id: updatedUser.id,
        email: updatedUser.email,
        ...updateUserDto,
      });
    } catch (error) {
      ErrorHandler.handle(error, 'UsersService.update');
    }
  }
  //no response in postman....
  async remove(
    id: number,
  ): Promise<ApiResponse<{ id: number; email: string }>> {
    try {
      const deletedUser = await this.prisma.user.delete({
        where: { id: id },
      });
      return SuccessResponseHandler.deleted('User', {
        id: deletedUser.id,
        email: deletedUser.email,
      });
    } catch (error) {
      ErrorHandler.handle(error, 'UsersService.delete');
    }
  }
}
