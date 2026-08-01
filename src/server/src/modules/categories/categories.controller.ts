// 分类控制器
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums/role.enum';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  SortCategoriesDto,
} from './dto/category.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 公开分类列表
  @Public()
  @Get('categories')
  findAll() {
    return this.categoriesService.findAll();
  }

  // 分类详情
  @Public()
  @Get('categories/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // 创建分类
  @Post('admin/categories')
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // 更新分类
  @Put('admin/categories/:id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  // 删除分类
  @Delete('admin/categories/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // 调整排序
  @Put('admin/categories/sort')
  @Roles(Role.ADMIN)
  sort(@Body() dto: SortCategoriesDto) {
    return this.categoriesService.sort(dto);
  }
}
