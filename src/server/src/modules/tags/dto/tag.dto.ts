// 标签 DTO
import { IsString, IsInt, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTagDto {
  @IsString()
  @MinLength(1, { message: '标签名不能为空' })
  @MaxLength(20, { message: '标签名最长 20 字符' })
  name: string;
}

export class MergeTagsDto {
  @Type(() => Number)
  @IsInt()
  sourceId: number;

  @Type(() => Number)
  @IsInt()
  targetId: number;
}
