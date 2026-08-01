// 标签服务
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { UpdateTagDto, MergeTagsDto } from './dto/tag.dto';
import { generateSlug } from '../../common/utils';

@Injectable()
export class TagsService {
  private readonly logger = new Logger('TagsService');

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // 公开标签列表
  async findAll(keyword?: string) {
    const where: Prisma.TagWhereInput = {};
    if (keyword) {
      where.name = { contains: keyword };
    }
    const list = await this.prisma.tag.findMany({
      where,
      orderBy: { articleCount: 'desc' },
    });
    return list.map((t) => ({
      id: Number(t.id),
      name: t.name,
      slug: t.slug,
      articleCount: t.articleCount,
    }));
  }

  // 标签详情
  async findBySlug(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
    });
    if (!tag) {
      throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
    }
    return {
      id: Number(tag.id),
      name: tag.name,
      slug: tag.slug,
      articleCount: tag.articleCount,
    };
  }

  // 更新标签名
  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: BigInt(id) },
    });
    if (!tag) {
      throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
    }
    // 若名称变更，slug 也更新
    const newSlug = dto.name !== tag.name ? generateSlug(dto.name) : tag.slug;
    const updated = await this.prisma.tag.update({
      where: { id: BigInt(id) },
      data: { name: dto.name, slug: newSlug },
    });
    await this.cacheService.del('tags:list');
    return {
      id: Number(updated.id),
      name: updated.name,
      slug: updated.slug,
    };
  }

  // 合并标签：将源标签合并到目标标签
  async merge(dto: MergeTagsDto) {
    const source = await this.prisma.tag.findUnique({
      where: { id: BigInt(dto.sourceId) },
    });
    const target = await this.prisma.tag.findUnique({
      where: { id: BigInt(dto.targetId) },
    });
    if (!source) {
      throw new BusinessException(ErrorCode.TAG_NOT_FOUND, '源标签不存在');
    }
    if (!target) {
      throw new BusinessException(ErrorCode.TAG_NOT_FOUND, '目标标签不存在');
    }
    if (source.id === target.id) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '源标签与目标标签不能相同');
    }

    await this.prisma.$transaction(async (tx) => {
      // 查找源标签关联的文章
      const sourceRelations = await tx.articleTag.findMany({
        where: { tagId: source.id },
        select: { articleId: true },
      });

      // 对每篇文章：若已关联目标标签则跳过，否则更新为目标标签
      for (const rel of sourceRelations) {
        const existTarget = await tx.articleTag.findUnique({
          where: {
            articleId_tagId: {
              articleId: rel.articleId,
              tagId: target.id,
            },
          },
        });
        if (existTarget) {
          // 已有目标关联，删除源关联
          await tx.articleTag.delete({
            where: { articleId_tagId: { articleId: rel.articleId, tagId: source.id } },
          });
        } else {
          // 更新源关联为目标
          await tx.articleTag.delete({
            where: { articleId_tagId: { articleId: rel.articleId, tagId: source.id } },
          });
          await tx.articleTag.create({
            data: { articleId: rel.articleId, tagId: target.id },
          });
        }
      }

      // 更新目标标签计数
      const targetNewCount = await tx.articleTag.count({
        where: { tagId: target.id },
      });
      await tx.tag.update({
        where: { id: target.id },
        data: { articleCount: targetNewCount },
      });

      // 删除源标签
      await tx.tag.delete({ where: { id: source.id } });
    });

    await this.cacheService.del('tags:list');
    this.logger.log(`标签合并完成: ${source.name} -> ${target.name}`);
    return { merged: true };
  }

  // 删除标签（从关联文章移除，文章不删除）
  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: BigInt(id) },
    });
    if (!tag) {
      throw new BusinessException(ErrorCode.TAG_NOT_FOUND);
    }
    await this.prisma.$transaction(async (tx) => {
      // 删除关联
      await tx.articleTag.deleteMany({ where: { tagId: BigInt(id) } });
      // 删除标签
      await tx.tag.delete({ where: { id: BigInt(id) } });
    });
    await this.cacheService.del('tags:list');
  }
}
