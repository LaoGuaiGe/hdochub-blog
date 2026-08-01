// 友链 DTO
import {
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFriendLinkDto {
  @IsString()
  @MinLength(1, { message: '站点名称不能为空' })
  @MaxLength(50)
  name: string;

  @IsString()
  @IsUrl({}, { message: 'URL 格式不正确' })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number = 0;
}

export class UpdateFriendLinkDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}
