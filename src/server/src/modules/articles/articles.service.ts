// 文章服务：核心业务逻辑
// 文章 CRUD、状态流转、分页、标签关联、阅读量统计、归档、搜索
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { ArticleStatus } from '../../common/enums/status.enum';
import { Role } from '../../common/enums/role.enum';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
  AdminArticleQueryDto,
  MyArticleQueryDto,
  BatchArticleDto,
} from './dto/article.dto';
import {
  generateSlug,
  countWords,
  calcReadTime,
  extractSummary,
  getClientIp,
} from '../../common/utils';
import {
  renderMarkdown,
  highlightKeyword,
} from '../../common/utils/markdown';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger('ArticlesService');

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private cacheService: CacheService,
  ) {}

  // 公开文章列表（仅已发布）
  async findPublishedList(query: ArticleQueryDto, ip: string) {
    const page = query.safePage;
    const pageSize = query.safePageSize;

    // 解析排序
    const orderBy = this.parseSort(query.sort);

    // 构造 where
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
    };

    // 按分类筛选
    if (query.categoryId) {
      where.categoryId = BigInt(query.categoryId);
    } else if (query.categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: query.categorySlug },
      });
      if (cat) where.categoryId = cat.id;
    }

    // 按标签筛选
    if (query.tagId) {
      where.tags = { some: { tagId: BigInt(query.tagId) } };
    } else if (query.tagSlug) {
      const tag = await this.prisma.tag.findUnique({
        where: { slug: query.tagSlug },
      });
      if (tag) where.tags = { some: { tagId: tag.id } };
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.listSelect(),
      }),
      this.prisma.article.count({ where }),
    ]);

    return paginate(
      list.map((a) => this.toListVo(a)),
      total,
      page,
      pageSize,
    );
  }

  // 文章详情（公开）
  async findBySlug(slug: string, ip: string, currentUserId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        tags: { include: { tag: true } },
      },
    });

    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }

    // 非已发布状态：仅作者本人或管理员可见
    if (article.status !== ArticleStatus.PUBLISHED) {
      if (!currentUserId) {
        throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
      }
      const isAdmin = await this.isAdmin(currentUserId);
      if (article.authorId !== BigInt(currentUserId) && !isAdmin) {
        throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
      }
    }

    // 阅读量去重统计
    const shouldCount = await this.redisService.recordViewIfNotExists(article.id, ip);
    let viewCount = article.viewCount;
    if (shouldCount) {
      viewCount = await this.prisma.article
        .update({
          where: { id: article.id },
          data: { viewCount: { increment: 1 } },
          select: { viewCount: true },
        })
        .then((a) => a.viewCount);
    }

    // 查询当前用户是否已点赞
    let isLiked = false;
    if (currentUserId) {
      const like = await this.prisma.like.findUnique({
        where: {
          articleId_userId: {
            articleId: article.id,
            userId: BigInt(currentUserId),
          },
        },
      });
      isLiked = !!like;
    }

    return this.toDetailVo(article, viewCount, isLiked);
  }

  // 相关文章推荐（同分类或同标签，最多 5 篇）
  async findRelated(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: { tags: true },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }
    const tagIds = article.tags.map((t) => t.tagId);
    const related = await this.prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        id: { not: article.id },
        OR: [
          { categoryId: article.categoryId },
          ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
        ],
      },
      take: 5,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverImage: true,
        publishedAt: true,
      },
      distinct: ['id'],
    });
    return related.map((a) => ({
      ...a,
      id: Number(a.id),
      publishedAt: a.publishedAt?.toISOString() || null,
    }));
  }

  // 上一页/下一页
  async findAdjacent(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, publishedAt: true },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }

    const [prev, next] = await Promise.all([
      this.prisma.article.findFirst({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: { lt: article.publishedAt },
        },
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, slug: true },
      }),
      this.prisma.article.findFirst({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: { gt: article.publishedAt },
        },
        orderBy: { publishedAt: 'asc' },
        select: { id: true, title: true, slug: true },
      }),
    ]);

    return {
      prev: prev ? { id: Number(prev.id), title: prev.title, slug: prev.slug } : null,
      next: next ? { id: Number(next.id), title: next.title, slug: next.slug } : null,
    };
  }

  // 热门文章
  async findHot(limit: number = 5) {
    const safeLimit = Math.min(Math.max(limit, 1), 20);
    const list = await this.prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { viewCount: 'desc' },
      take: safeLimit,
      select: { id: true, title: true, slug: true, viewCount: true },
    });
    return list.map((a) => ({
      id: Number(a.id),
      title: a.title,
      slug: a.slug,
      viewCount: a.viewCount,
    }));
  }

  // 创建文章
  async create(dto: CreateArticleDto, userId: string) {
    // 校验分类存在
    const category = await this.prisma.category.findUnique({
      where: { id: BigInt(dto.categoryId) },
    });
    if (!category) {
      throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    // 校验标签数量
    if (dto.tags && dto.tags.length > 10) {
      throw new BusinessException(ErrorCode.TAG_LIMIT_EXCEEDED);
    }

    const wordCount = countWords(dto.content);
    const summary = dto.summary || extractSummary(dto.content, 200);
    const contentHtml = renderMarkdown(dto.content);
    const slug = await this.generateUniqueSlug(dto.title);
    const publishedAt =
      dto.status === ArticleStatus.PUBLISHED ? new Date() : null;

    // 事务：创建文章、关联标签、更新分类计数
    const article = await this.prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          title: dto.title,
          slug,
          content: dto.content,
          contentHtml,
          summary,
          coverImage: dto.coverImage || null,
          authorId: BigInt(userId),
          categoryId: BigInt(dto.categoryId),
          status: dto.status,
          wordCount,
          publishedAt,
        },
      });

      // 处理标签
      if (dto.tags && dto.tags.length > 0) {
        for (const tagName of dto.tags) {
          const tag = await this.upsertTag(tx, tagName);
          await tx.articleTag.create({
            data: { articleId: article.id, tagId: tag.id },
          });
          await tx.tag.update({
            where: { id: tag.id },
            data: { articleCount: { increment: 1 } },
          });
        }
      }

      // 若已发布，更新分类文章数 + 作者文章数
      if (dto.status === ArticleStatus.PUBLISHED) {
        await tx.category.update({
          where: { id: BigInt(dto.categoryId) },
          data: { articleCount: { increment: 1 } },
        });
        await tx.user.update({
          where: { id: BigInt(userId) },
          data: { articleCount: { increment: 1 } },
        });
      }

      return article;
    });

    // 清缓存
    await this.invalidateArticleCache();

    return {
      id: Number(article.id),
      slug: article.slug,
      status: article.status,
      publishedAt: article.publishedAt?.toISOString() || null,
    };
  }

  // 更新文章
  async update(id: string, dto: UpdateArticleDto, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(id) },
      include: { tags: true },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }

    // 资源级鉴权：仅作者或管理员
    const isAdmin = await this.isAdmin(userId);
    if (article.authorId !== BigInt(userId) && !isAdmin) {
      throw new BusinessException(ErrorCode.FORBIDDEN_RESOURCE);
    }

    // 校验分类
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: BigInt(dto.categoryId) },
      });
      if (!category) {
        throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
      }
    }

    // 校验标签数量
    if (dto.tags && dto.tags.length > 10) {
      throw new BusinessException(ErrorCode.TAG_LIMIT_EXCEEDED);
    }

    // 准备更新数据
    const data: Prisma.ArticleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) {
      data.content = dto.content;
      data.contentHtml = renderMarkdown(dto.content);
      data.wordCount = countWords(dto.content);
    }
    if (dto.summary !== undefined) data.summary = dto.summary;
    else if (dto.content) data.summary = extractSummary(dto.content, 200);
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.categoryId !== undefined) {
      data.category = { connect: { id: BigInt(dto.categoryId) } };
    }

    // 状态流转：DRAFT -> PUBLISHED 设置 publishedAt
    const wasPublished = article.status === ArticleStatus.PUBLISHED;
    const willPublish = dto.status === ArticleStatus.PUBLISHED;
    const willUnpublish = dto.status === ArticleStatus.DRAFT;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (willPublish && !wasPublished && !article.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // 更新文章
      await tx.article.update({ where: { id: BigInt(id) }, data });

      // 更新标签关联（若传了 tags）
      if (dto.tags !== undefined) {
        // 删除旧关联
        const oldTagIds = article.tags.map((t) => t.tagId);
        if (oldTagIds.length > 0) {
          await tx.articleTag.deleteMany({
            where: { articleId: BigInt(id) },
          });
          // 旧标签计数 -1
          for (const tagId of oldTagIds) {
            await tx.tag.update({
              where: { id: tagId },
              data: { articleCount: { decrement: 1 } },
            });
          }
        }
        // 新建关联
        for (const tagName of dto.tags) {
          const tag = await this.upsertTag(tx, tagName);
          await tx.articleTag.create({
            data: { articleId: BigInt(id), tagId: tag.id },
          });
          await tx.tag.update({
            where: { id: tag.id },
            data: { articleCount: { increment: 1 } },
          });
        }
      }

      // 分类计数维护
      if (dto.categoryId && dto.categoryId !== Number(article.categoryId)) {
        if (wasPublished) {
          await tx.category.update({
            where: { id: article.categoryId },
            data: { articleCount: { decrement: 1 } },
          });
          await tx.category.update({
            where: { id: BigInt(dto.categoryId) },
            data: { articleCount: { increment: 1 } },
          });
        }
      }

      // 发布状态变更维护分类/作者计数
      if (!wasPublished && willPublish) {
        // 草稿/下架 -> 发布：分类 +1、作者 +1
        await tx.category.update({
          where: { id: article.categoryId },
          data: { articleCount: { increment: 1 } },
        });
        await tx.user.update({
          where: { id: article.authorId },
          data: { articleCount: { increment: 1 } },
        });
      } else if (wasPublished && willUnpublish) {
        // 发布 -> 草稿：分类 -1、作者 -1
        await tx.category.update({
          where: { id: article.categoryId },
          data: { articleCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: article.authorId },
          data: { articleCount: { decrement: 1 } },
        });
      }
    });

    // 清缓存
    await this.invalidateArticleCache();

    const updated = await this.prisma.article.findUnique({
      where: { id: BigInt(id) },
      include: {
        category: true,
        author: { select: { id: true, username: true, nickname: true, avatar: true } },
        tags: { include: { tag: true } },
      },
    });
    return this.toDetailVo(updated, updated.viewCount, false);
  }

  // 删除文章（硬删除）
  async remove(id: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(id) },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }
    const isAdmin = await this.isAdmin(userId);
    if (article.authorId !== BigInt(userId) && !isAdmin) {
      throw new BusinessException(ErrorCode.FORBIDDEN_RESOURCE);
    }

    await this.prisma.$transaction(async (tx) => {
      // 若为已发布，维护分类/作者计数
      if (article.status === ArticleStatus.PUBLISHED) {
        await tx.category.update({
          where: { id: article.categoryId },
          data: { articleCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: article.authorId },
          data: { articleCount: { decrement: 1 } },
        });
      }
      // 删除文章（关联表 cascade）
      await tx.article.delete({ where: { id: BigInt(id) } });
    });

    await this.invalidateArticleCache();
  }

  // 发布草稿
  async publish(id: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(id) },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }
    const isAdmin = await this.isAdmin(userId);
    if (article.authorId !== BigInt(userId) && !isAdmin) {
      throw new BusinessException(ErrorCode.FORBIDDEN_RESOURCE);
    }

    const wasPublished = article.status === ArticleStatus.PUBLISHED;
    const publishedAt = article.publishedAt || new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: BigInt(id) },
        data: { status: ArticleStatus.PUBLISHED, publishedAt },
      });
      if (!wasPublished) {
        await tx.category.update({
          where: { id: article.categoryId },
          data: { articleCount: { increment: 1 } },
        });
        await tx.user.update({
          where: { id: article.authorId },
          data: { articleCount: { increment: 1 } },
        });
      }
    });

    await this.invalidateArticleCache();
    return {
      id: Number(article.id),
      status: ArticleStatus.PUBLISHED,
      publishedAt: publishedAt.toISOString(),
    };
  }

  // 转为草稿（撤回）
  async unpublish(id: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(id) },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }
    const isAdmin = await this.isAdmin(userId);
    if (article.authorId !== BigInt(userId) && !isAdmin) {
      throw new BusinessException(ErrorCode.FORBIDDEN_RESOURCE);
    }

    const wasPublished = article.status === ArticleStatus.PUBLISHED;

    await this.prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: BigInt(id) },
        data: { status: ArticleStatus.DRAFT },
      });
      if (wasPublished) {
        await tx.category.update({
          where: { id: article.categoryId },
          data: { articleCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: article.authorId },
          data: { articleCount: { decrement: 1 } },
        });
      }
    });

    await this.invalidateArticleCache();
    return { id: Number(article.id), status: ArticleStatus.DRAFT };
  }

  // 我的文章列表（含草稿、已下架）
  async findMyList(query: MyArticleQueryDto, userId: string) {
    const page = Number(query.page) || 1;
    const pageSize = Math.min(Number(query.pageSize) || 20, 50);
    const where: Prisma.ArticleWhereInput = {
      authorId: BigInt(userId),
    };
    if (query.status) {
      where.status = query.status;
    }
    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.listSelect(),
      }),
      this.prisma.article.count({ where }),
    ]);
    return paginate(
      list.map((a) => this.toListVo(a)),
      total,
      page,
      pageSize,
    );
  }

  // 归档列表（按年月分组）
  async findArchive() {
    const list = await this.prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, slug: true, publishedAt: true },
    });

    // 按年月分组
    const groups: Record<string, Record<string, any[]>> = {};
    for (const a of list) {
      const date = a.publishedAt;
      if (!date) continue;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearKey = String(year);
      const monthKey = String(month);
      if (!groups[yearKey]) groups[yearKey] = {};
      if (!groups[yearKey][monthKey]) groups[yearKey][monthKey] = [];
      groups[yearKey][monthKey].push({
        id: Number(a.id),
        title: a.title,
        slug: a.slug,
        publishedAt: date.toISOString(),
      });
    }

    // 转换为数组
    return Object.keys(groups)
      .sort((a, b) => Number(b) - Number(a))
      .map((year) => ({
        year: Number(year),
        months: Object.keys(groups[year])
          .sort((a, b) => Number(b) - Number(a))
          .map((month) => ({
            month: Number(month),
            articles: groups[year][month],
          })),
      }));
  }

  // 搜索文章
  async search(q: string, page: number = 1, pageSize: number = 10) {
    if (!q || !q.trim()) {
      return paginate([], 0, page, pageSize);
    }
    const keyword = q.trim();
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
      OR: [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ],
    };
    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          publishedAt: true,
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return paginate(
      list.map((a) => ({
        id: Number(a.id),
        title: highlightKeyword(a.title, keyword),
        summary: highlightKeyword(a.summary || '', keyword),
        slug: a.slug,
        publishedAt: a.publishedAt?.toISOString() || null,
      })),
      total,
      page,
      pageSize,
    );
  }

  // 管理员：全站文章列表
  async adminFindList(query: AdminArticleQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Math.min(Number(query.pageSize) || 20, 50);
    const where: Prisma.ArticleWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = BigInt(query.categoryId);
    if (query.authorId) where.authorId = BigInt(query.authorId);
    if (query.title) where.title = { contains: query.title };
    if (query.startDate || query.endDate) {
      where.publishedAt = {};
      if (query.startDate) where.publishedAt.gte = new Date(query.startDate);
      if (query.endDate) where.publishedAt.lte = new Date(query.endDate);
    }
    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.adminListSelect(),
      }),
      this.prisma.article.count({ where }),
    ]);
    return paginate(
      list.map((a) => this.toAdminListVo(a)),
      total,
      page,
      pageSize,
    );
  }

  // 管理员：下架文章
  async adminArchive(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(id) },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }
    const wasPublished = article.status === ArticleStatus.PUBLISHED;
    await this.prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: BigInt(id) },
        data: { status: ArticleStatus.ARCHIVED },
      });
      if (wasPublished) {
        await tx.category.update({
          where: { id: article.categoryId },
          data: { articleCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: article.authorId },
          data: { articleCount: { decrement: 1 } },
        });
      }
    });
    await this.invalidateArticleCache();
    return { id: Number(article.id), status: ArticleStatus.ARCHIVED };
  }

  // 管理员：恢复上架
  async adminRestore(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(id) },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: BigInt(id) },
        data: { status: ArticleStatus.PUBLISHED },
      });
      // 下架时已减少计数，恢复时增加（仅在之前是 published 被下架的情况）
      if (article.publishedAt) {
        await tx.category.update({
          where: { id: article.categoryId },
          data: { articleCount: { increment: 1 } },
        });
        await tx.user.update({
          where: { id: article.authorId },
          data: { articleCount: { increment: 1 } },
        });
      }
    });
    await this.invalidateArticleCache();
    return { id: Number(article.id), status: ArticleStatus.PUBLISHED };
  }

  // 管理员：批量操作
  async adminBatch(dto: BatchArticleDto) {
    const ids = dto.ids.map((id) => BigInt(id));
    for (const id of ids) {
      try {
        if (dto.action === 'archive') {
          await this.adminArchive(id.toString());
        } else if (dto.action === 'restore') {
          await this.adminRestore(id.toString());
        } else if (dto.action === 'delete') {
          const article = await this.prisma.article.findUnique({ where: { id } });
          if (article) {
            await this.prisma.$transaction(async (tx) => {
              if (article.status === ArticleStatus.PUBLISHED) {
                await tx.category.update({
                  where: { id: article.categoryId },
                  data: { articleCount: { decrement: 1 } },
                });
                await tx.user.update({
                  where: { id: article.authorId },
                  data: { articleCount: { decrement: 1 } },
                });
              }
              await tx.article.delete({ where: { id } });
            });
          }
        }
      } catch (e) {
        this.logger.warn(`批量操作失败 id=${id}: ${e.message}`);
      }
    }
    await this.invalidateArticleCache();
    return { processed: ids.length };
  }

  // 生成唯一 slug（避免冲突）
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let n = 1;
    while (await this.prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`;
    }
    return slug;
  }

  // 创建或获取标签（事务内）
  private async upsertTag(tx: Prisma.TransactionClient, name: string) {
    const slug = generateSlug(name);
    return tx.tag.upsert({
      where: { name },
      update: {},
      create: { name, slug },
    });
  }

  // 判断是否管理员
  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { role: true },
    });
    return user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  }

  // 解析排序参数
  private parseSort(sort?: string): Prisma.ArticleOrderByWithRelationInput[] {
    if (!sort) return [{ publishedAt: 'desc' }];
    if (sort === '-view_count') return [{ viewCount: 'desc' }];
    if (sort === 'view_count') return [{ viewCount: 'asc' }];
    if (sort === 'published_at') return [{ publishedAt: 'asc' }];
    return [{ publishedAt: 'desc' }];
  }

  // 列表查询 select（精简字段）
  private listSelect() {
    return {
      id: true,
      title: true,
      slug: true,
      summary: true,
      coverImage: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      publishedAt: true,
      category: { select: { id: true, name: true, slug: true } },
      author: {
        select: { id: true, username: true, nickname: true, avatar: true },
      },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    };
  }

  // 管理员列表 select（含更多字段）
  private adminListSelect() {
    return {
      ...this.listSelect(),
      status: true,
      wordCount: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  // 列表 VO
  private toListVo(a: any) {
    return {
      id: Number(a.id),
      title: a.title,
      slug: a.slug,
      summary: a.summary,
      coverImage: a.coverImage,
      category: a.category
        ? { id: Number(a.category.id), name: a.category.name, slug: a.category.slug }
        : null,
      tags: (a.tags || []).map((t: any) => t.tag).filter(Boolean).map((tag: any) => ({
        id: Number(tag.id),
        name: tag.name,
        slug: tag.slug,
      })),
      author: a.author
        ? {
            id: Number(a.author.id),
            username: a.author.username,
            nickname: a.author.nickname,
            avatar: a.author.avatar,
          }
        : null,
      viewCount: a.viewCount,
      likeCount: a.likeCount,
      commentCount: a.commentCount,
      publishedAt: a.publishedAt?.toISOString() || null,
    };
  }

  // 管理员列表 VO
  private toAdminListVo(a: any) {
    return {
      ...this.toListVo(a),
      status: a.status,
      wordCount: a.wordCount,
      createdAt: a.createdAt?.toISOString() || null,
      updatedAt: a.updatedAt?.toISOString() || null,
    };
  }

  // 详情 VO
  private toDetailVo(article: any, viewCount: number, isLiked: boolean) {
    return {
      id: Number(article.id),
      title: article.title,
      slug: article.slug,
      content: article.content,
      contentHtml: article.contentHtml,
      summary: article.summary,
      coverImage: article.coverImage,
      category: article.category,
      tags: (article.tags || []).map((t: any) => t.tag),
      author: article.author
        ? {
            ...article.author,
            id: Number(article.author.id),
          }
        : null,
      status: article.status,
      viewCount,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      wordCount: article.wordCount,
      readTime: calcReadTime(article.wordCount),
      isLiked,
      publishedAt: article.publishedAt?.toISOString() || null,
      createdAt: article.createdAt?.toISOString() || null,
      updatedAt: article.updatedAt?.toISOString() || null,
    };
  }

  // 失效文章相关缓存
  private async invalidateArticleCache() {
    await this.cacheService.del('articles:published:list');
    await this.cacheService.del('articles:hot');
    await this.cacheService.del('archive:list');
  }
}
