// 分类 DTO
import {
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1, { message: '分类名不能为空' })
  @MaxLength(20, { message: '分类名最长 20 字符' })
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number = 0;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}

export class SortItemDto {
  @Type(() => Number)
  @IsInt()
  id: number;

  @Type(() => Number)
  @IsInt()
  sort: number;
}

export class SortCategoriesDto {
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SortItemDto)
  items: SortItemDto[];
}
