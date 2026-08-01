// 用户资料 DTO
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '昵称不能为空' })
  @MaxLength(20, { message: '昵称最长 20 字符' })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '简介最长 200 字符' })
  bio?: string;
}
