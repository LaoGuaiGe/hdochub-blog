// 用户服务
// 用户主页、更新资料、头像上传、个人统计
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { ArticleStatus } from '../../common/enums/status.enum';
import { UpdateProfileDto } from './dto/user.dto';
import { UploadsService } from '../uploads/uploads.service';
import { paginate } from '../../common/dto/pagination.dto';
import { ArticleQueryDto } from '../articles/dto/article.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    private prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  // 用户主页（公开）
  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        articleCount: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    return {
      ...user,
      id: Number(user.id),
      createdAt: user.createdAt.toISOString(),
    };
  }

  // 用户主页文章列表（公开）
  async findUserArticles(username: string, query: ArticleQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    const page = query.safePage;
    const pageSize = query.safePageSize;
    const where = {
      authorId: user.id,
      status: ArticleStatus.PUBLISHED,
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
          coverImage: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          publishedAt: true,
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      this.prisma.article.count({ where }),
    ]);
    return paginate(
      list.map((a) => ({
        id: Number(a.id),
        title: a.title,
        slug: a.slug,
        summary: a.summary,
        coverImage: a.coverImage,
        viewCount: a.viewCount,
        likeCount: a.likeCount,
        commentCount: a.commentCount,
        publishedAt: a.publishedAt?.toISOString() || null,
        category: a.category,
        tags: a.tags.map((t) => t.tag),
      })),
      total,
      page,
      pageSize,
    );
  }

  // 更新个人资料
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.bio !== undefined) data.bio = dto.bio;
    await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data,
    });
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
      },
    });
    return {
      ...user,
      id: Number(user.id),
    };
  }

  // 上传头像
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const result = await this.uploadsService.uploadImage(file, userId, 'AVATAR');
    await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: { avatar: result.url },
    });
    return { avatar: result.url };
  }

  // 个人统计概览
  async getStats(userId: string) {
    const [articleCount, totalView, totalLike, commentCount] = await Promise.all([
      this.prisma.article.count({
        where: { authorId: BigInt(userId), status: ArticleStatus.PUBLISHED },
      }),
      this.prisma.article.aggregate({
        where: { authorId: BigInt(userId), status: ArticleStatus.PUBLISHED },
        _sum: { viewCount: true },
      }),
      this.prisma.article.aggregate({
        where: { authorId: BigInt(userId), status: ArticleStatus.PUBLISHED },
        _sum: { likeCount: true },
      }),
      this.prisma.comment.count({
        where: { article: { authorId: BigInt(userId) } },
      }),
    ]);
    return {
      articleCount,
      totalViewCount: totalView._sum.viewCount || 0,
      totalLikeCount: totalLike._sum.likeCount || 0,
      commentCount,
    };
  }
}
