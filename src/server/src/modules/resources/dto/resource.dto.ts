// 资源 DTO
import {
  IsString,
  IsInt,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceStatus } from '../../../common/enums/status.enum';

// 创建资源
export class CreateResourceDto {
  @IsString()
  @MinLength(1, { message: '标题不能为空' })
  @MaxLength(100, { message: '标题最多 100 字符' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsString()
  @MinLength(1, { message: '下载地址不能为空' })
  @MaxLength(500)
  downloadUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  extractionCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['baidu'])
  panType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  @IsIn([ResourceStatus.PUBLISHED, ResourceStatus.DRAFT, ResourceStatus.OFFLINE])
  status?: string;
}

// 更新资源
export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  downloadUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  extractionCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['baidu'])
  panType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  @IsIn([ResourceStatus.PUBLISHED, ResourceStatus.DRAFT, ResourceStatus.OFFLINE])
  status?: string;
}
