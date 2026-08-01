// 文章相关 DTO
import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  IsIn,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArticleStatus } from '../../../common/enums/status.enum';

// 创建/更新文章 DTO
export class CreateArticleDto {
  @IsString()
  @MinLength(1, { message: '标题不能为空' })
  @MaxLength(100, { message: '标题长度需在 1-100 字符之间' })
  title: string;

  @IsString()
  @MinLength(10, { message: '正文至少 10 字符' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: '每篇文章最多 10 个标签' })
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsString()
  @IsIn([ArticleStatus.DRAFT, ArticleStatus.PUBLISHED])
  status: string;
}

// 更新文章 DTO（所有字段可选）
export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  @IsIn([ArticleStatus.DRAFT, ArticleStatus.PUBLISHED])
  status?: string;
}

// 文章列表查询 DTO
export class ArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string = '-published_at';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tagId?: number;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  tagSlug?: string;

  // 分页辅助方法
  get safePage(): number {
    const p = Number(this.page) || 1;
    return Math.max(p, 1);
  }

  get safePageSize(): number {
    const size = Number(this.pageSize) || 10;
    return Math.min(Math.max(size, 1), 50);
  }
}

// 管理员文章查询 DTO
export class AdminArticleQueryDto extends ArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

// 我的文章查询 DTO
export class MyArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;
}

// 批量操作 DTO
export class BatchArticleDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @IsString()
  @IsIn(['archive', 'restore', 'delete'])
  action: string;
}
