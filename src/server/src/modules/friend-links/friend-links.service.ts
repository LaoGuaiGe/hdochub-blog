// 友链服务
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { FriendLinkStatus } from '../../common/enums/status.enum';
import { CreateFriendLinkDto, UpdateFriendLinkDto } from './dto/friend-link.dto';

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
}
