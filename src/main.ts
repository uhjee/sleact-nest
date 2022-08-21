import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exceptionFilters/http-exception.filter';
import passport from 'passport';
import session from 'express-session';
import path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // generic으로 express 사용하겠다고 명시
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT || 3095;

  // Exception filter 등록
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validationPipe 등록
  app.useGlobalPipes(
    new ValidationPipe({
      // transform: true, // dto 자동 변환
    }),
  );

  // express-session
  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: process.env.COOKIE_SECRET,
      cookie: {
        httpOnly: true,
      },
    }),
  );

  // passport 관련
  app.use(passport.initialize());
  app.use(passport.session());

  // cors 옵션
  if (process.env.NODE_ENV === 'production') {
    app.enableCors({
      origin: ['https://sleact.nodebird.com'],
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }

  // static 파일 제공
  app.useStaticAssets(
    process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '..', '..', 'uploads')
      : path.join(__dirname, '..', '..', 'uploads'),
    // : path.join(__dirname, '..', 'uploads'), // dev 모드인데도 dist에서 참조..
    {
      prefix: '/uploads',
    },
  );

  app.useStaticAssets(
    process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '..', '..', 'public')
      : path.join(__dirname, '..', '..', 'public'),
    // : path.join(__dirname, '..', 'public'),// // dev 모드인데도 dist에서 참조..
    {
      prefix: '/dist',
    },
  );

  // swagger setting (http://localhost:3000/api)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sleact API')
    .setDescription('Sleact 개발을 위한 API 문서입니다.')
    .setVersion('1.0')
    .addCookieAuth('connect.sid')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  Logger.log(`Listening on port ${port}`);
}

bootstrap();
