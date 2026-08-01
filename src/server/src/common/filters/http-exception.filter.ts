// 全局异常过滤器
// 统一捕获异常并映射为 { code, message, data } 响应格式
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode, ERROR_MESSAGES } from '../enums/error-code.enum';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code = ErrorCode.INTERNAL_ERROR;
    let message = ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR];
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let data: any = null;

    if (exception instanceof BusinessException) {
      code = exception.bizCode;
      message = exception.bizMessage;
      data = exception.bizData;
      httpStatus = exception.getStatus();
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'object' && resp !== null) {
        const r: any = resp;
        // class-validator 校验错误
        if (Array.isArray(r.message)) {
          code = ErrorCode.VALIDATION_ERROR;
          message = r.message.join('; ');
        } else if (typeof r.message === 'string') {
          code = ErrorCode.PARAM_ERROR;
          message = r.message;
        } else if (typeof r.code === 'number') {
          code = r.code;
          message = r.message || message;
        }
      } else {
        message = String(resp);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma 已知错误
      if (exception.code === 'P2002') {
        // 唯一约束冲突
        const target = (exception.meta?.target as string[]) || [];
        code = ErrorCode.PARAM_ERROR;
        const field = target[0] || '字段';
        if (field === 'username') {
          code = ErrorCode.USERNAME_TAKEN;
        } else if (field === 'email') {
          code = ErrorCode.EMAIL_TAKEN;
        } else if (field === 'slug') {
          message = '该 slug 已被占用';
        } else {
          message = `${field} 已存在`;
        }
        httpStatus = HttpStatus.BAD_REQUEST;
      } else if (exception.code === 'P2025') {
        // 记录不存在
        code = ErrorCode.PARAM_ERROR;
        message = '资源不存在';
        httpStatus = HttpStatus.NOT_FOUND;
      } else {
        code = ErrorCode.DB_ERROR;
        message = ERROR_MESSAGES[ErrorCode.DB_ERROR];
        httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      // 数据库连接失败
      code = ErrorCode.DB_ERROR;
      message = '数据库连接失败，请稍后再试';
      httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
      this.logger.error(`数据库连接失败: ${exception.message}`);
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Prisma 参数校验错误
      code = ErrorCode.PARAM_ERROR;
      message = '数据校验失败';
      httpStatus = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof Error) {
      this.logger.error(exception.stack);
    }

    // 记录服务端错误日志
    if (httpStatus >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${httpStatus} - ${exception instanceof Error ? exception.stack : exception}`,
      );
    }

    response.status(httpStatus).json({
      code,
      message,
      data,
    });
  }
}
