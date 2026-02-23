import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { setAuthCookies } from '../../common/cookies/auth-cookie.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('google'))
  @Get('google/login')
  googleLogin() {}

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req, @Res({ passthrough: true }) res) {
    if (!req.user) return res.status(401).send('Unauthorized');
    const { accessToken, refreshToken } = await this.authService.googleLogin(
      req.user,
    );

    // ✅ Set cookies
    setAuthCookies(req, res, accessToken, refreshToken);

    return res.redirect('http://localhost:3000');
  }
}
