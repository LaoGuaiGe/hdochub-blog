// 点赞服务
// 每用户每篇仅可赞一次（唯一约束），点赞可取消
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { ArticleStatus } from '../../common/enums/status.enum';

@Injectable()
export class LikesService {
  private readonly logger = new Logger('LikesService');

  constructor(private prisma: PrismaService) {}

  // 点赞
  async like(articleId: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(articleId) },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }
    if (article.status !== ArticleStatus.PUBLISHED) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }

    // 检查是否已点赞
    const exist = await this.prisma.like.findUnique({
      where: {
        articleId_userId: {
          articleId: BigInt(articleId),
          userId: BigInt(userId),
        },
      },
    });
    if (exist) {
      throw new BusinessException(ErrorCode.ALREADY_LIKED);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: { articleId: BigInt(articleId), userId: BigInt(userId) },
      });
      await tx.article.update({
        where: { id: BigInt(articleId) },
        data: { likeCount: { increment: 1 } },
      });
    });

    return {
      likeCount: article.likeCount + 1,
      isLiked: true,
    };
  }

  // 取消点赞
  async unlike(articleId: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: BigInt(articleId) },
    });
    if (!article) {
      throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
    }

    const exist = await this.prisma.like.findUnique({
      where: {
        articleId_userId: {
          articleId: BigInt(articleId),
          userId: BigInt(userId),
        },
      },
    });
    if (!exist) {
      // 幂等：未点赞也返回成功
      return {
        likeCount: article.likeCount,
        isLiked: false,
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.delete({
        where: {
          articleId_userId: {
            articleId: BigInt(articleId),
            userId: BigInt(userId),
          },
        },
      });
      await tx.article.update({
        where: { id: BigInt(articleId) },
        data: { likeCount: { decrement: 1 } },
      });
    });

    return {
      likeCount: Math.max(0, article.likeCount - 1),
      isLiked: false,
    };
  }

  // 查询点赞状态
  async getStatus(articleId: string, userId: string) {
    const exist = await this.prisma.like.findUnique({
      where: {
        articleId_userId: {
          articleId: BigInt(articleId),
          userId: BigInt(userId),
        },
      },
    });
    return { isLiked: !!exist };
  }
}
