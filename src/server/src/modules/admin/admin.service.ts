// 管理员服务
// 用户列表、改角色、封禁/解封、重置密码、创建管理员、全站统计
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { Role } from '../../common/enums/role.enum';
import { UserStatus, ArticleStatus, CommentStatus } from '../../common/enums/status.enum';
import { AdminUserQueryDto, UpdateUserRoleDto } from './dto/admin-user.dto';
import { AuthService } from '../auth/auth.service';
import { CreateAdminDto } from '../auth/dto/auth.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { randomId } from '../../common/utils';

@Injectable()
export class AdminService {
  private readonly logger = new Logger('AdminService');

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // 用户列表
  async findUsers(query: AdminUserQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Math.min(Number(query.pageSize) || 20, 50);
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          role: true,
          status: true,
          articleCount: true,
          commentCount: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(
      list.map((u) => ({
        ...u,
        id: Number(u.id),
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  // 修改用户角色（仅超级管理员）
  async updateUserRole(id: string, dto: UpdateUserRoleDto, operatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    // 不可操作超级管理员
    if (user.role === Role.SUPER_ADMIN) {
      throw new BusinessException(ErrorCode.CANNOT_OPERATE_SUPER_ADMIN);
    }
    // 校验目标角色
    if (![Role.ADMIN, Role.USER].includes(dto.role as Role)) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '角色只能为 ADMIN 或 USER');
    }
    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { role: dto.role },
    });
    return { id: Number(user.id), role: dto.role };
  }

  // 封禁用户
  async banUser(id: string, operatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.role === Role.SUPER_ADMIN) {
      throw new BusinessException(ErrorCode.CANNOT_OPERATE_SUPER_ADMIN);
    }
    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { status: UserStatus.BANNED },
    });
    return { id: Number(user.id), status: UserStatus.BANNED };
  }

  // 解封用户
  async unbanUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { status: UserStatus.ACTIVE, lockedUntil: null, loginFailCount: 0 },
    });
    return { id: Number(user.id), status: UserStatus.ACTIVE };
  }

  // 重置用户密码
  async resetPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.role === Role.SUPER_ADMIN) {
      throw new BusinessException(ErrorCode.CANNOT_OPERATE_SUPER_ADMIN);
    }
    // 生成临时密码
    const tempPassword = this.generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { password: hashed },
    });
    return { tempPassword };
  }

  // 创建管理员（仅超级管理员）
  async createAdmin(dto: CreateAdminDto) {
    return this.authService.createAdmin(dto);
  }

  // 全站统计概览
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      articleCount,
      userCount,
      commentCount,
      pendingCommentCount,
      todayNewUsers,
    ] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.user.count(),
      this.prisma.comment.count({ where: { status: CommentStatus.PUBLISHED } }),
      this.prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      this.prisma.user.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
    ]);

    // 今日阅读量（简化：取所有文章今日之前的 viewCount 差值不可得，这里返回累计阅读量）
    const viewAgg = await this.prisma.article.aggregate({
      _sum: { viewCount: true },
    });

    return {
      articleCount,
      userCount,
      commentCount,
      todayViewCount: viewAgg._sum.viewCount || 0,
      todayNewUsers,
      pendingCommentCount,
    };
  }

  // 生成临时密码（满足密码规则：8-16 字符，含字母与数字）
  private generateTempPassword(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const chars = letters + digits;
    let pwd = '';
    pwd += letters[Math.floor(Math.random() * letters.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    for (let i = 0; i < 8; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    // 打乱
    return pwd
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
