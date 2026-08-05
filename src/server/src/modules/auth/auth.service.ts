// 认证服务：注册、登录、登出、修改密码、刷新 Token
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { RegisterDto, LoginDto, ChangePasswordDto, CreateAdminDto } from './dto/auth.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/status.enum';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { getClientIp } from '../../common/utils';
import { CaptchaService } from '../captcha/captcha.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  // 登录失败 5 次锁定 15 分钟
  private readonly MAX_LOGIN_FAIL = 5;
  private readonly LOCK_MINUTES = 15;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private cacheService: CacheService,
    private captchaService: CaptchaService,
  ) {}

  // 注册
  async register(dto: RegisterDto, req: any) {
    // 检查注册开关
    const registrationEnabled = await this.getSetting('registration_enabled');
    if (registrationEnabled === 'false') {
      throw new BusinessException(ErrorCode.REGISTRATION_CLOSED);
    }

    // 校验图形验证码（防止批量注册）
    const captchaOk = await this.captchaService.verify(dto.captchaId, dto.captcha);
    if (!captchaOk) {
      throw new BusinessException(ErrorCode.CAPTCHA_WRONG);
    }

    // 校验用户名
    const existUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existUsername) {
      throw new BusinessException(ErrorCode.USERNAME_TAKEN);
    }

    // 校验邮箱
    const existEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existEmail) {
      throw new BusinessException(ErrorCode.EMAIL_TAKEN);
    }

    // 密码哈希
    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashed,
        role: Role.USER,
        status: UserStatus.ACTIVE,
      },
    });

    // 生成 Token
    const token = await this.generateToken(user.id, user.username, user.role, false);

    this.logger.log(`新用户注册: ${user.username}`);

    return {
      token,
      user: this.toUserVo(user),
    };
  }

  // 登录
  async login(dto: LoginDto, req: any) {
    // 按用户名或邮箱查询
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.account }, { email: dto.account }],
      },
    });

    if (!user) {
      throw new BusinessException(ErrorCode.LOGIN_FAILED);
    }

    // 检查封禁
    if (user.status === UserStatus.BANNED) {
      throw new BusinessException(ErrorCode.ACCOUNT_BANNED);
    }

    // 检查锁定
    if (
      user.status === UserStatus.LOCKED ||
      (user.lockedUntil && user.lockedUntil > new Date())
    ) {
      throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
    }

    // 校验密码
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      // 失败次数 +1
      const failCount = user.loginFailCount + 1;
      const shouldLock = failCount >= this.MAX_LOGIN_FAIL;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginFailCount: failCount,
          status: shouldLock ? UserStatus.LOCKED : user.status,
          lockedUntil: shouldLock
            ? new Date(Date.now() + this.LOCK_MINUTES * 60 * 1000)
            : user.lockedUntil,
        },
      });
      if (shouldLock) {
        throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
      }
      throw new BusinessException(ErrorCode.LOGIN_FAILED);
    }

    // 登录成功：重置失败次数、记录登录信息
    const ip = getClientIp(req);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginFailCount: 0,
        status: UserStatus.ACTIVE,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    const remember = dto.remember === true;
    const token = await this.generateToken(user.id, user.username, user.role, remember);

    this.logger.log(`用户登录: ${user.username}`);

    return {
      token,
      user: this.toUserVo(user),
    };
  }

  // 登出：将 Token 加入黑名单
  async logout(token: string) {
    if (!token) return;
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(`jwt:blacklist:${token}`, '1', ttl);
        }
      }
    } catch (e) {
      this.logger.warn(`登出黑名单写入失败: ${e.message}`);
    }
  }

  // 获取当前用户信息
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    return {
      id: Number(user.id),
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      articleCount: user.articleCount,
      commentCount: user.commentCount,
    };
  }

  // 修改密码
  async changePassword(userId: string, dto: ChangePasswordDto, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }

    const ok = await bcrypt.compare(dto.oldPassword, user.password);
    if (!ok) {
      throw new BusinessException(ErrorCode.OLD_PASSWORD_WRONG);
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // 旧 Token 加入黑名单
    if (token) {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(`jwt:blacklist:${token}`, '1', ttl);
        }
      }
    }
  }

  // 刷新 Token
  async refresh(payload: JwtPayload, remember: boolean) {
    const token = await this.generateToken(
      BigInt(payload.sub),
      payload.username,
      payload.role as Role,
      remember,
    );
    return { token };
  }

  // 创建管理员（P2，仅超级管理员）
  async createAdmin(dto: CreateAdminDto) {
    const existUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existUsername) {
      throw new BusinessException(ErrorCode.USERNAME_TAKEN);
    }
    const existEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existEmail) {
      throw new BusinessException(ErrorCode.EMAIL_TAKEN);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const role = dto.role === Role.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.ADMIN;
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashed,
        role,
        status: UserStatus.ACTIVE,
      },
    });
    this.logger.log(`管理员账号已创建: ${user.username} (${role})`);
    return this.toUserVo(user);
  }

  // 生成 JWT
  private async generateToken(
    userId: bigint,
    username: string,
    role: string,
    remember: boolean,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId.toString(),
      username,
      role,
    };
    const expiresIn = remember
      ? this.configService.get<string>('jwt.rememberExpiresIn')
      : this.configService.get<string>('jwt.expiresIn');
    return this.jwtService.sign(payload, { expiresIn });
  }

  // 读取站点设置（带缓存）
  private async getSetting(key: string): Promise<string | null> {
    const cached = await this.cacheService.get<string>(`setting:${key}`);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    const s = await this.prisma.setting.findUnique({ where: { key } });
    if (s) {
      await this.cacheService.set(`setting:${key}`, s.value, 600);
      return s.value;
    }
    return null;
  }

  // 用户对象转 VO（去除密码等敏感字段）
  private toUserVo(user: any) {
    return {
      id: Number(user.id),
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      email: user.email,
    };
  }
}
