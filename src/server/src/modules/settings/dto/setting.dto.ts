// 站点设置 DTO
import { IsString, IsInt, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  siteTitle?: string;

  @IsOptional()
  @IsString()
  siteSubtitle?: string;

  @IsOptional()
  @IsString()
  siteDescription?: string;

  @IsOptional()
  @IsString()
  siteIcp?: string;

  @IsOptional()
  siteCommentReviewEnabled?: boolean | string;

  @IsOptional()
  registrationEnabled?: boolean | string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;

  @IsOptional()
  @IsString()
  adminPath?: string;

  @IsOptional()
  @IsString()
  aboutContent?: string;

  @IsOptional()
  @IsString()
  siteUrl?: string;
}
