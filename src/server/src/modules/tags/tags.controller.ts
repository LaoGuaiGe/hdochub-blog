// 标签控制器
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums/role.enum';
import { UpdateTagDto, MergeTagsDto } from './dto/tag.dto';

@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // 公开标签列表
  @Public()
  @Get('tags')
  findAll(@Query('keyword') keyword?: string) {
    return this.tagsService.findAll(keyword);
  }

  // 标签详情
  @Public()
  @Get('tags/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }

  // 更新标签名
  @Put('admin/tags/:id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  // 合并标签
  @Post('admin/tags/merge')
  @Roles(Role.ADMIN)
  merge(@Body() dto: MergeTagsDto) {
    return this.tagsService.merge(dto);
  }

  // 删除标签
  @Delete('admin/tags/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
