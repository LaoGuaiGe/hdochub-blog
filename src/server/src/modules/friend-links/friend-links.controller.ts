// 友链控制器
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { FriendLinksService } from './friend-links.service';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums/role.enum';
import { CreateFriendLinkDto, UpdateFriendLinkDto } from './dto/friend-link.dto';

@Controller()
export class FriendLinksController {
  constructor(private readonly friendLinksService: FriendLinksService) {}

  // 公开友链列表
  @Public()
  @Get('friend-links')
  findAll() {
    return this.friendLinksService.findAll();
  }

  // 创建友链
  @Post('admin/friend-links')
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateFriendLinkDto) {
    return this.friendLinksService.create(dto);
  }

  // 更新友链
  @Put('admin/friend-links/:id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateFriendLinkDto) {
    return this.friendLinksService.update(id, dto);
  }

  // 删除友链
  @Delete('admin/friend-links/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.friendLinksService.remove(id);
  }
}
