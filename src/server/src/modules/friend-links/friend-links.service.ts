// 友链服务
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { FriendLinkStatus } from '../../common/enums/status.enum';
import { FriendLinkApplicationStatus } from '../../common/enums/status.enum';
import { CreateFriendLinkDto, UpdateFriendLinkDto } from './dto/friend-link.dto';
import {
  CreateFriendLinkApplicationDto,
  ReviewFriendLinkApplicationDto,
} from './dto/friend-link-application.dto';

@Injectable()
export class FriendLinksService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // 公开友链列表
  async findAll() {
    return this.cacheService.wrap('friend-links:list', async () => {
      const list = await this.prisma.friendLink.findMany({
        where: { status: FriendLinkStatus.VISIBLE },
        orderBy: { sort: 'asc' },
      });
      return list.map((f) => ({
        id: Number(f.id),
        name: f.name,
        url: f.url,
        description: f.description,
        logo: f.logo,
      }));
    });
  }

  // 创建友链
  async create(dto: CreateFriendLinkDto) {
    const link = await this.prisma.friendLink.create({
      data: {
        name: dto.name,
        url: dto.url,
        description: dto.description || null,
        logo: dto.logo || null,
        sort: dto.sort ?? 0,
        status: FriendLinkStatus.VISIBLE,
      },
    });
    await this.cacheService.del('friend-links:list');
    return {
      id: Number(link.id),
      name: link.name,
      url: link.url,
      sort: link.sort,
    };
  }

  // 更新友链
  async update(id: string, dto: UpdateFriendLinkDto) {
    const link = await this.prisma.friendLink.findUnique({
      where: { id: BigInt(id) },
    });
    if (!link) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '友链不存在');
    }
    const updated = await this.prisma.friendLink.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.sort !== undefined && { sort: dto.sort }),
      },
    });
    await this.cacheService.del('friend-links:list');
    return {
      id: Number(updated.id),
      name: updated.name,
      url: updated.url,
      sort: updated.sort,
    };
  }

  // 删除友链
  async remove(id: string) {
    await this.prisma.friendLink.delete({ where: { id: BigInt(id) } });
    await this.cacheService.del('friend-links:list');
  }

  // ============ 友链申请 ============

  // 公开提交友链申请
  async submitApplication(dto: CreateFriendLinkApplicationDto) {
    const app = await this.prisma.friendLinkApplication.create({
      data: {
        name: dto.name,
        url: dto.url,
        description: dto.description || null,
        contactName: dto.contactName || null,
        status: FriendLinkApplicationStatus.PENDING,
      },
    });
    return { id: Number(app.id), status: app.status };
  }

  // 管理员：申请列表
  async findApplications(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const list = await this.prisma.friendLinkApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return list.map((a) => ({
      id: Number(a.id),
      name: a.name,
      url: a.url,
      description: a.description,
      contactName: a.contactName,
      status: a.status,
      rejectReason: a.rejectReason,
      createdAt: a.createdAt.toISOString(),
      reviewedAt: a.reviewedAt?.toISOString() || null,
    }));
  }

  // 管理员：通过申请（同时创建友链）
  async approveApplication(id: string) {
    const app = await this.prisma.friendLinkApplication.findUnique({
      where: { id: BigInt(id) },
    });
    if (!app) {
      throw new BusinessException(ErrorCode.APPLICATION_NOT_FOUND);
    }
    if (app.status !== FriendLinkApplicationStatus.PENDING) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '该申请已处理');
    }

    await this.prisma.$transaction(async (tx) => {
      // 创建友链
      await tx.friendLink.create({
        data: {
          name: app.name,
          url: app.url,
          description: app.description || null,
          status: FriendLinkStatus.VISIBLE,
          sort: 0,
        },
      });
      // 更新申请状态
      await tx.friendLinkApplication.update({
        where: { id: app.id },
        data: {
          status: FriendLinkApplicationStatus.APPROVED,
          reviewedAt: new Date(),
          rejectReason: null,
        },
      });
    });

    await this.cacheService.del('friend-links:list');
    return { id: Number(app.id), status: FriendLinkApplicationStatus.APPROVED };
  }

  // 管理员：拒绝申请
  async rejectApplication(id: string, dto: ReviewFriendLinkApplicationDto) {
    const app = await this.prisma.friendLinkApplication.findUnique({
      where: { id: BigInt(id) },
    });
    if (!app) {
      throw new BusinessException(ErrorCode.APPLICATION_NOT_FOUND);
    }
    if (app.status !== FriendLinkApplicationStatus.PENDING) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '该申请已处理');
    }
    await this.prisma.friendLinkApplication.update({
      where: { id: BigInt(id) },
      data: {
        status: FriendLinkApplicationStatus.REJECTED,
        reviewedAt: new Date(),
        rejectReason: dto.rejectReason || null,
      },
    });
    return { id: Number(app.id), status: FriendLinkApplicationStatus.REJECTED };
  }

  // 管理员：删除申请
  async removeApplication(id: string) {
    await this.prisma.friendLinkApplication.delete({
      where: { id: BigInt(id) },
    });
  }
}
