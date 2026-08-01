// 应用入口
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParserFn = require('cookie-parser');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');
import * as fs from 'fs';
import * as path from 'path';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const corsOrigin = configService.get<string>('cors.origin') || 'http://localhost:3000';

  // 安全头
  app.use(helmet());

  // Cookie 解析
  app.use(cookieParserFn());

  // CORS 配置
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 全局路由前缀
  app.setGlobalPrefix('api', {
    exclude: [
      'rss.xml',
      'sitemap.xml',
      'robots.txt',
      'uploads',
    ],
  });

  // 全局 ValidationPipe（class-validator 参数校验）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 去除未声明的属性
      transform: true, // 自动类型转换
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 全局拦截器：日志 -> 响应格式转换
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // 全局守卫：JWT 鉴权（全局默认开启，@Public 装饰器跳过）
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );

  // 静态文件服务：上传的图片
  const uploadDir = configService.get<string>('upload.dir') || './uploads';
  const absUploadDir = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.resolve(process.cwd(), uploadDir);
  if (!fs.existsSync(absUploadDir)) {
    fs.mkdirSync(absUploadDir, { recursive: true });
  }
  const express = require('express');
  app.use('/uploads', express.static(absUploadDir));

  await app.listen(port);
  logger.log(`应用已启动，监听端口: ${port}`);
  logger.log(`API Base URL: http://localhost:${port}/api`);
  logger.log(`CORS 允许来源: ${corsOrigin}`);
}
bootstrap();
