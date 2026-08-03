// JWT 鉴权守卫：全局默认开启，校验 Token 并注入 req.user
// @Public() 装饰的接口跳过校验
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ErrorCode } from '../enums/error-code.enum';
import { BusinessException } from '../exceptions/business.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // 公开接口也尝试解析 token（失败不拦截游客），供 @CurrentUser() 使用
      try {
        await super.canActivate(context);
      } catch {
        // 忽略：无 token 或 token 无效时游客正常访问公开接口
      }
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }
    return user;
  }
}
