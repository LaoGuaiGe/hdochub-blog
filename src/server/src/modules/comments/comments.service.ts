// 评论服务
// 支持楼中楼嵌套回复（最多 3 层，超过 3 层在第 3 层平铺）
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { CommentStatus } from '../../common/enums/status.enum';
import { Role } from '../../common/enums/role.enum';
import { CreateCommentDto, AdminCommentQueryDto } from './dto/comment.dto';
import { renderCommentHtml } from '../../common/utils/markdown';
import { paginate } from '../../common/dto/pagination.dto';

// 最大嵌套深度
const MAX_DEPTH = 3;

@Injectable()
export class CommentsService {
  private readonly logger = new Logger('CommentsService');

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // 文章评论列表（公开，按时间正序，楼中楼嵌套）
  async findByArticle(slug: string, page: number = 1, pageSize: number = 20) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }

    // 查询所有已发布评论
    const where: Prisma.CommentWhereInput = {
      articleId: article.id,
      status: CommentStatus.PUBLISHED,
    };
    const [allComments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }],
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          replyToUser: {
            select: { id: true, nickname: true, username: true },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    // 构建嵌套结构
    const tree = this.buildCommentTree(allComments);

    // 分页：按顶级评论分页
    const topLevels = tree;
    const start = (page - 1) * pageSize;
    const pagedTop = topLevels.slice(start, start + pageSize);

    return paginate(
      pagedTop.map((c) => this.toTreeVo(c)),
      topLevels.length,
      page,
      pageSize,
    );
  }

  // 发表评论
  async create(slug: string, dto: CreateCommentDto, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true, status: true, authorId: true },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }

    let depth = 0;
    let floor = 0;
    let parentId: bigint | null = null;
    let replyToUserId: bigint | null = null;

    // 处理回复
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: BigInt(dto.parentId) },
      });
      if (!parent) {
        throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND, '父评论不存在');
      }
      if (parent.articleId !== article.id) {
        throw new BusinessException(ErrorCode.PARAM_ERROR, '父评论不属于该文章');
      }
      // 计算深度：父评论深度 +1，超过 MAX_DEPTH 固定为 MAX_DEPTH（平铺）
      depth = Math.min(parent.depth + 1, MAX_DEPTH);
      parentId = parent.id;
      replyToUserId = dto.replyToUserId ? BigInt(dto.replyToUserId) : parent.userId;
    } else {
      // 顶级评论：计算楼层
      const maxFloor = await this.prisma.comment.aggregate({
        where: { articleId: article.id, depth: 0 },
        _max: { floor: true },
      });
      floor = (maxFloor._max.floor || 0) + 1;
    }

    // 检查评论审核开关
    const reviewEnabled = await this.getReviewEnabled();
    const status = reviewEnabled ? CommentStatus.PENDING : CommentStatus.PUBLISHED;

    const contentHtml = renderCommentHtml(dto.content);

    const comment = await this.prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          articleId: article.id,
          userId: BigInt(userId),
          parentId,
          replyToUserId,
          content: dto.content,
          contentHtml,
          floor,
          depth,
          status,
        },
      });

      // 若直接发布，文章评论数 +1、用户评论数 +1
      if (status === CommentStatus.PUBLISHED) {
        await tx.article.update({
          where: { id: article.id },
          data: { commentCount: { increment: 1 } },
        });
        await tx.user.update({
          where: { id: BigInt(userId) },
          data: { commentCount: { increment: 1 } },
        });
      }
      return c;
    });

    return {
      id: Number(comment.id),
      content: comment.content,
      contentHtml: comment.contentHtml,
      depth: comment.depth,
      floor: comment.floor,
      status: comment.status,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  // 删除评论（软删除，子回复保留）
  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: BigInt(id) },
    });
    if (!comment) {
      throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
    }

    // 资源级鉴权：仅评论者本人或管理员
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { role: true },
    });
    const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
    if (comment.userId !== BigInt(userId) && !isAdmin) {
      throw new BusinessException(ErrorCode.FORBIDDEN_RESOURCE);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: BigInt(id) },
        data: { status: CommentStatus.DELETED, content: '该评论已删除', contentHtml: null },
      });
      // 若原状态为已发布，文章评论数 -1、用户评论数 -1
      if (comment.status === CommentStatus.PUBLISHED) {
        await tx.article.update({
          where: { id: comment.articleId },
          data: { commentCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: comment.userId },
          data: { commentCount: { decrement: 1 } },
        });
      }
    });
  }

  // 我收到的评论（他人对我文章的评论）
  async findReceived(userId: string, page: number = 1, pageSize: number = 20) {
    const where: Prisma.CommentWhereInput = {
      article: { authorId: BigInt(userId) },
      userId: { not: BigInt(userId) },
      status: CommentStatus.PUBLISHED,
    };
    const [list, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          article: { select: { id: true, title: true, slug: true } },
          user: {
            select: { id: true, nickname: true, username: true, avatar: true },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return paginate(
      list.map((c) => ({
        id: Number(c.id),
        content: c.content,
        article: {
          id: Number(c.article.id),
          title: c.article.title,
          slug: c.article.slug,
        },
        user: {
          ...c.user,
          id: Number(c.user.id),
        },
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  // 我发表的评论（在他人文章下）
  async findMine(userId: string, page: number = 1, pageSize: number = 20) {
    const where: Prisma.CommentWhereInput = {
      userId: BigInt(userId),
      article: { authorId: { not: BigInt(userId) } },
    };
    const [list, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          article: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return paginate(
      list.map((c) => ({
        id: Number(c.id),
        content: c.content,
        status: c.status,
        article: {
          id: Number(c.article.id),
          title: c.article.title,
          slug: c.article.slug,
        },
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  // 管理员：全站评论列表
  async adminFindList(query: AdminCommentQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Math.min(Number(query.pageSize) || 20, 50);
    const where: Prisma.CommentWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.articleId) where.articleId = BigInt(query.articleId);
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    const [list, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          article: { select: { id: true, title: true } },
          user: { select: { id: true, nickname: true, username: true } },
          replyToUser: { select: { id: true, nickname: true, username: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return paginate(
      list.map((c) => ({
        id: Number(c.id),
        content: c.content,
        status: c.status,
        depth: c.depth,
        article: c.article
          ? { id: Number(c.article.id), title: c.article.title }
          : null,
        user: c.user
          ? { ...c.user, id: Number(c.user.id) }
          : null,
        replyToUser: c.replyToUser
          ? { ...c.replyToUser, id: Number(c.replyToUser.id) }
          : null,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  // 管理员：审核通过评论
  async adminApprove(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: BigInt(id) },
    });
    if (!comment) {
      throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: BigInt(id) },
        data: { status: CommentStatus.PUBLISHED },
      });
      // 由待审核转为发布，增加计数
      if (comment.status === CommentStatus.PENDING) {
        await tx.article.update({
          where: { id: comment.articleId },
          data: { commentCount: { increment: 1 } },
        });
        await tx.user.update({
          where: { id: comment.userId },
          data: { commentCount: { increment: 1 } },
        });
      }
    });
    return { id: Number(comment.id), status: CommentStatus.PUBLISHED };
  }

  // 管理员：删除评论
  async adminRemove(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: BigInt(id) },
    });
    if (!comment) {
      throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: BigInt(id) },
        data: { status: CommentStatus.DELETED, content: '该评论已删除', contentHtml: null },
      });
      if (comment.status === CommentStatus.PUBLISHED) {
        await tx.article.update({
          where: { id: comment.articleId },
          data: { commentCount: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: comment.userId },
          data: { commentCount: { decrement: 1 } },
        });
      }
    });
  }

  // 构建评论嵌套树
  // 超过 MAX_DEPTH 的评论，平铺在其顶级评论下（通过 parentId 链查找根评论）
  private buildCommentTree(comments: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    // 第一遍：建立 map
    for (const c of comments) {
      map.set(c.id.toString(), { ...c, replies: [] });
    }

    // 第二遍：构建树
    for (const c of comments) {
      const node = map.get(c.id.toString());
      if (!c.parentId) {
        roots.push(node);
      } else {
        // 找到根评论：沿 parentId 向上找
        let root = c;
        let depth = 0;
        while (root.parentId && depth < MAX_DEPTH) {
          const parent = map.get(root.parentId.toString());
          if (!parent) break;
          root = parent;
          depth++;
          if (parent.depth === 0) break;
        }
        // 找到根评论后挂载
        let rootNode = c;
        while (rootNode.parentId) {
          const parent = map.get(rootNode.parentId.toString());
          if (!parent) break;
          if (parent.depth === 0) {
            parent.replies.push(node);
            break;
          }
          rootNode = parent;
        }
      }
    }

    // 排序 replies 按时间正序
    const sortReplies = (nodes: any[]) => {
      nodes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      for (const n of nodes) {
        if (n.replies && n.replies.length) sortReplies(n.replies);
      }
    };
    sortReplies(roots);

    return roots;
  }

  // 树形 VO
  private toTreeVo(c: any) {
    return {
      id: Number(c.id),
      content: c.content,
      contentHtml: c.contentHtml,
      floor: c.floor,
      depth: c.depth,
      user: c.user ? { ...c.user, id: Number(c.user.id) } : null,
      replyToUser: c.replyToUser
        ? { ...c.replyToUser, id: Number(c.replyToUser.id) }
        : null,
      createdAt: c.createdAt.toISOString(),
      replies: (c.replies || []).map((r: any) => this.toTreeVo(r)),
    };
  }

  // 读取评论审核开关
  private async getReviewEnabled(): Promise<boolean> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'comment_review_enabled' },
    });
    return setting?.value === 'true';
  }
}
