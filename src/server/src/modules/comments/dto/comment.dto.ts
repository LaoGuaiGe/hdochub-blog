// 评论 DTO
import {
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: '评论内容不能为空' })
  @MaxLength(500, { message: '评论内容最长 500 字符' })
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  replyToUserId?: number;
}

// 管理员评论查询 DTO
export class AdminCommentQueryDto {
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  articleId?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
