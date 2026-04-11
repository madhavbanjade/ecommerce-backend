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
import { ProductsService } from '../products/products.service.js';
import type { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

interface JwtPayload {
  id: string;
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
    private readonly productService: ProductsService
    
  ) {}
  private generateImageUrl(req: Request, path: string): string {
  return `${req.protocol}://${req.get('host')}${path}`;
}

private transformUser(user: any, req: Request) {
  return {
    ...user,
    image: user.image ? this.generateImageUrl(req, user.image) : null,
  };
}


  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<User>> {
    return ErrorHandler.execute(async () => {
      const { username, email, role, fullname, gender, contact, dob } = createUserDto;
      const hashedPassword = await this.bcryptService.hashPassword(
        createUserDto.password,
      );
      const created = await this.prisma.user.create({
        data: { username, email, password: hashedPassword, role, fullname, gender, contact, dob },
      });
      // console.log('user', created);
      return SuccessResponseHandler.created('User', created);
    }, 'UsersService.create');
  }

  async login(loginUserDto: LoginUserDto): Promise<
    ApiResponse<{
      id: string;
      email: string;
      access_token: string;
      refresh_token: string;
    }>
  > {
    return ErrorHandler.execute(async () => {
      const { username, password } = loginUserDto;

      // 1️⃣ Find user by email
      const user = await this.prisma.user.findUnique({
        where: { username },
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
        id: user.id,
        name: user.username || '',
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
        username: user.username,
        email: user.email,
        access_token,
        refresh_token,
      });
    }, 'UsersService.login');
  }

 async findAll(req: Request): Promise<ApiResponse<any>> {
  return ErrorHandler.execute(async () => {  // ✅ wrap in ErrorHandler
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
         contact: true,
        gender: true,
        dob: true,
        image: true,
        role: true,
        wishlist: { select: { id: true, name: true } },
        cart: {
  select: {
    id: true,
    quantity: true,
    size: true,
    product: {
      select: {
        name: true,
        originalPrice: true,
        dicountPrice: true,
      }
    }
  }
}
        
      }


    })

      const transformed = users.map((user) => this.transformUser(user, req));

    return SuccessResponseHandler.retrived('Users', transformed);
  }, 'UsersService.findAll')
}
async getMe(userId: string, req: Request): Promise<ApiResponse<any>> {
  const user: any = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullname: true,
      email: true,
      contact: true,
      gender: true,
      dob: true,
      image: true,
      role: true,
      wishlist: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw ErrorHandler.notFound(`User with id ${userId}`);
  }

  // 👇 single object, no .map()
  const transformed = this.transformUser(user, req);

  return SuccessResponseHandler.retrived('User', transformed);
}

//update
 async update(
id: string, updateUserDto: UpdateUserDto, files: Express.Multer.File, req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>> | undefined,
): Promise<ApiResponse<any>> {
  try {
    const data: any = { ...updateUserDto };

   if (files) {
      data.image = `/uploads/image/${files.filename}`;
    }
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    return SuccessResponseHandler.updated('User', {
      id: updatedUser.id,
      email: updatedUser.email,
     image: updatedUser.image, 
      ...updateUserDto,
    });
  } catch (error) {
    ErrorHandler.handle(error, 'UsersService.update');
  }
}

 
  //no response in postman....
  async remove(
    id: string,
  ): Promise<ApiResponse<{ id: string; email: string }>> {
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

  //toggle wishlist
  async toogleWishlist(
    userId: string,
    productId: string,
  ): Promise<ApiResponse<any>> {
    return ErrorHandler.execute(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { wishlist: { where: { id: productId } } },
      });
      console.log('userService -> ', user);
      if (!user) {
        throw new Error('User not found');
      }
      const isWishlisted = user.wishlist.length > 0;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          wishlist: isWishlisted
            ? { disconnect: { id: productId } }
            : { connect: { id: productId } },
        },
      });
      return SuccessResponseHandler.retrived('Wishlist', {
        wishlisted: !isWishlisted,
        message: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      });
    }, 'UserService.toogleWishlist');
  }

    async getWishlist(userId: string, req: Request) {
      return ErrorHandler.execute(async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            wishlist: {
              include: { sizes: true, category: true },
            },
          },
        });
        return SuccessResponseHandler.retrived('Wishlist', 
          
          user?.wishlist.map((p:any) => this.productService.transformProduct(p, req))
        
        ); //fix
      }, 'UserService.getWishlist');
    }
}
