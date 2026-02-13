import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import type { StringValue } from 'ms';
import { AuthService } from './auth.service.js';
import { GoogleStrategy } from '../../common/strategies/google.strategy.js';
import { PrismaService } from '../../prisma.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('EXPIRES_IN') as StringValue,
        },
      }),
    }),
  ],
  providers: [AuthService, GoogleStrategy, PrismaService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
