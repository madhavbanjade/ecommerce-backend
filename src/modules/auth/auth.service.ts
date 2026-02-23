import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async googleLogin(googleUser: any) {
    if (!googleUser) {
      throw new UnauthorizedException();
    }

    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          username: googleUser.username,
        },
      });
    }

     const payload = { sub: user.id, email: user.email };
     const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
     const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });


    return {user, accessToken, refreshToken };
  }
}
