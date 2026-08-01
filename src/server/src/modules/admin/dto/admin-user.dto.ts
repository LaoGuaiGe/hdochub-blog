// 管理员用户管理 DTO
import { IsString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminUserQueryDto {
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
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateUserRoleDto {
  @IsString()
  role: string; // ADMIN / USER
}
