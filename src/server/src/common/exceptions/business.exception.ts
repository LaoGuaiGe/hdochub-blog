// 业务异常类
// 用于在 Service 层抛出带错误码的业务错误，由 HttpExceptionFilter 统一处理
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ERROR_MESSAGES } from '../enums/error-code.enum';

export class BusinessException extends HttpException {
  public readonly bizCode: number;
  public readonly bizMessage: string;
  public readonly bizData: any;

  constructor(code: ErrorCode, message?: string, data: any = null, httpStatus?: HttpStatus) {
    const msg = message || ERROR_MESSAGES[code] || '业务错误';
    const status = httpStatus || mapCodeToHttpStatus(code);

    super({ code, message: msg, data }, status);
    this.bizCode = code;
    this.bizMessage = msg;
    this.bizData = data;
  }

  static throw(code: ErrorCode, message?: string, data?: any): never {
    throw new BusinessException(code, message, data);
  }
}

// 业务错误码 -> HTTP 状态码映射
function mapCodeToHttpStatus(code: number): HttpStatus {
  const prefix = Math.floor(code / 1000);
  if (code === ErrorCode.SUCCESS) return HttpStatus.OK;
  if (prefix === 40) {
    // 400xx -> 400, 401xx -> 401, 403xx -> 403, 404xx -> 404, 409xx -> 409
    const sub = Math.floor(code / 100);
    if (sub === 401) return HttpStatus.UNAUTHORIZED;
    if (sub === 403) return HttpStatus.FORBIDDEN;
    if (sub === 404) return HttpStatus.NOT_FOUND;
    if (sub === 409) return HttpStatus.CONFLICT;
    return HttpStatus.BAD_REQUEST;
  }
  if (prefix === 413) return HttpStatus.PAYLOAD_TOO_LARGE;
  if (prefix === 415) return HttpStatus.UNSUPPORTED_MEDIA_TYPE;
  if (prefix === 429) return HttpStatus.TOO_MANY_REQUESTS;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}
