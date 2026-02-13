import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  //upload files
  //changing while deplying
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      //whitelist: true, // strips unknown fields
      //forbidNonWhitelisted: true, // throws error for extra fields
      transform: true, // auto-transform types
    }),
  );

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.setGlobalPrefix('api/v1'); // all routes will be prefixed with /apif
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
console.log('sth is running in port');
console.log(`your app in running ${process.env.PORT}`);
