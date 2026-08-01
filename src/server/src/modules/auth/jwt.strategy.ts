// JWT 策略：解析并校验 JWT Token
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { BusinessException } from '../../common/exceptions/business.exception';
import { UserStatus } from '../../common/enums/status.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // 优先从 Authorization Header 取
          const authHeader = req?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          // 兼容 Cookie
          if (req?.cookies?.access_token) {
            return req.cookies.access_token;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload): Promise<JwtPayload> {
    // 校验 Token 是否在黑名单（用 jti，这里简化用 token 字符串 hash 作 jti）
    const token =
      req?.headers?.authorization?.substring(7) || req?.cookies?.access_token;
    if (token) {
      // 简单实现：以 token 字符串作为黑名单 key
      const blacklisted = await this.redisService.get(`jwt:blacklist:${token}`);
      if (blacklisted === '1') {
        throw new BusinessException(ErrorCode.TOKEN_INVALID);
      }
    }

    // 查询用户是否存在及状态
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(payload.sub) },
      select: { id: true, status: true, role: true, username: true },
    });

    if (!user) {
      throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    if (user.status === UserStatus.BANNED) {
      throw new BusinessException(ErrorCode.ACCOUNT_BANNED);
    }

    // 返回注入 req.user 的 payload
    return {
      sub: user.id.toString(),
      username: user.username,
      role: user.role,
    };
  }
}
