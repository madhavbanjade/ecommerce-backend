import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // STEP 1: Redirect to Google
  @Get('google/login')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  // STEP 2: Google callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    // const result = await this.authService.googleLogin(req.user);

    return res.redirect(`http://localhost:3000`); // frontend URL
  }
}

