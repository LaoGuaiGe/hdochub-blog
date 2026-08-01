// 分类服务
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  SortCategoriesDto,
} from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger('CategoriesService');

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // 公开分类列表
  async findAll() {
    return this.cacheService.wrap('categories:list', async () => {
      const list = await this.prisma.category.findMany({
        orderBy: { sort: 'asc' },
      });
      return list.map((c) => ({
        id: Number(c.id),
        name: c.name,
        slug: c.slug,
        description: c.description,
        articleCount: c.articleCount,
        sort: c.sort,
      }));
    });
  }

  // 分类详情
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (!category) {
      throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
    }
    return {
      id: Number(category.id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      articleCount: category.articleCount,
      sort: category.sort,
    };
  }

  // 创建分类
  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        sort: dto.sort ?? 0,
      },
    });
    await this.cacheService.del('categories:list');
    return {
      id: Number(category.id),
      name: category.name,
      slug: category.slug,
      sort: category.sort,
    };
  }

  // 更新分类
  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: BigInt(id) },
    });
    if (!category) {
      throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
    }
    const updated = await this.prisma.category.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sort !== undefined && { sort: dto.sort }),
      },
    });
    await this.cacheService.del('categories:list');
    return {
      id: Number(updated.id),
      name: updated.name,
      slug: updated.slug,
      sort: updated.sort,
    };
  }

  // 删除分类（分类下有文章时拒绝）
  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: BigInt(id) },
    });
    if (!category) {
      throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
    }
    if (category.articleCount > 0) {
      throw new BusinessException(
        ErrorCode.CATEGORY_NOT_EMPTY,
        `该分类下还有 ${category.articleCount} 篇文章，无法删除，请先迁移`,
      );
    }
    await this.prisma.category.delete({ where: { id: BigInt(id) } });
    await this.cacheService.del('categories:list');
  }

  // 调整排序
  async sort(dto: SortCategoriesDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.category.update({
          where: { id: BigInt(item.id) },
          data: { sort: item.sort },
        }),
      ),
    );
    await this.cacheService.del('categories:list');
    return { processed: dto.items.length };
  }
}
