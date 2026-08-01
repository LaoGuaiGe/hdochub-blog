// 自定义限流守卫：基于 Redis 按 IP/用户限流
// 通过 @RateLimit() 装饰器配置限流规则
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ErrorCode } from '../enums/error-code.enum';
import { BusinessException } from '../exceptions/business.exception';
import { getClientIp } from '../utils';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (limit: number, windowSeconds: number, keyPrefix: string) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds, keyPrefix });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<{
      limit: number;
      windowSeconds: number;
      keyPrefix: string;
    }>(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]);

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const ip = getClientIp(request);

    // 若用户已登录，按用户 ID 限流；否则按 IP
    let keyPart = ip;
    if (request.user?.sub) {
      keyPart = `u:${request.user.sub}`;
    }

    const key = `ratelimit:${config.keyPrefix}:${keyPart}`;
    const { allowed } = await this.redisService.rateLimit(
      key,
      config.limit,
      config.windowSeconds,
    );

    if (!allowed) {
      throw new BusinessException(ErrorCode.RATE_LIMIT);
    }

    return true;
  }
}
