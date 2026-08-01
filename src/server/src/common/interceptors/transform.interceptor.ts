// 统一响应格式拦截器
// 将 Controller 返回的数据包装为 { code, message, data }
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ErrorCode } from '../enums/error-code.enum';
import { ApiResponse } from '../dto/pagination.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 若已是标准响应格式，直接返回
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'message' in data
        ) {
          return data as any;
        }
        return {
          code: ErrorCode.SUCCESS,
          message: 'success',
          data,
        };
      }),
    );
  }
}
