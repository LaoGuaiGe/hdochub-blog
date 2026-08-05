// 资源控制器
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums/role.enum';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';

@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  // 公开资源列表
  @Public()
  @Get('resources')
  findAll() {
    return this.resourcesService.findAll();
  }

  // 公开资源详情
  @Public()
  @Get('resources/:id')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  // 公开：获取下载地址（同时 +1 下载次数）
  @Public()
  @Post('resources/:id/download')
  recordDownload(@Param('id') id: string) {
    return this.resourcesService.recordDownload(id);
  }

  // 管理员：资源列表
  @Get('admin/resources')
  @Roles(Role.ADMIN)
  adminFindAll() {
    return this.resourcesService.adminFindAll();
  }

  // 管理员：创建资源
  @Post('admin/resources')
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  // 管理员：更新资源
  @Put('admin/resources/:id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }

  // 管理员：删除资源
  @Delete('admin/resources/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }
}
