import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErrorHandler } from '../handlers/error.handler.js';
import { getBaseCookieOptions } from '../cookies/auth-cookie.js';

@Injectable()
export class ProtectLoginGuard implements CanActivate {
  //dependency Injection
  constructor(
    private readonly jwtservice: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    //refresh token
    const refresh_token = request.cookies.refresh_token;

    // ✅ No refresh token → user NOT logged in → allow login
    if (!refresh_token) {
      return true;
    }
    let payload: any;
    try {
      payload = await this.jwtservice.verifyAsync(refresh_token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw ErrorHandler.unauthorized('Invalid refresh token');
    }

    //access token
    const access_token = request.cookies.access_token;

    if (!access_token) {
      const newAccessToken = this.jwtservice.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      response.cookie('access_token', newAccessToken, {
        ...getBaseCookieOptions,
      });
    } else {
      try {
        await this.jwtservice.verifyAsync(access_token, {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
      } catch {
        ErrorHandler.unauthorized('Invalid access token');
      }
    }

    //request variable if valid
    request['user'] = payload; //!!!
    console.log(request.user);
    return true;
  }
}
