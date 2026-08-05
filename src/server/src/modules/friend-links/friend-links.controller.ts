// 友链控制器
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FriendLinksService } from './friend-links.service';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums/role.enum';
import { CreateFriendLinkDto, UpdateFriendLinkDto } from './dto/friend-link.dto';
import {
  CreateFriendLinkApplicationDto,
  ReviewFriendLinkApplicationDto,
} from './dto/friend-link-application.dto';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Controller()
export class FriendLinksController {
  constructor(private readonly friendLinksService: FriendLinksService) {}

  // 公开友链列表
  @Public()
  @Get('friend-links')
  findAll() {
    return this.friendLinksService.findAll();
  }

  // 公开提交友链申请
  @Public()
  @Post('friend-links/applications')
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600, 'fl-application')
  submitApplication(@Body() dto: CreateFriendLinkApplicationDto) {
    return this.friendLinksService.submitApplication(dto);
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

  // 管理员：友链申请列表
  @Get('admin/friend-links/applications')
  @Roles(Role.ADMIN)
  findApplications(@Query('status') status?: string) {
    return this.friendLinksService.findApplications(status);
  }

  // 管理员：通过申请
  @Put('admin/friend-links/applications/:id/approve')
  @Roles(Role.ADMIN)
  approveApplication(@Param('id') id: string) {
    return this.friendLinksService.approveApplication(id);
  }

  // 管理员：拒绝申请
  @Put('admin/friend-links/applications/:id/reject')
  @Roles(Role.ADMIN)
  rejectApplication(
    @Param('id') id: string,
    @Body() dto: ReviewFriendLinkApplicationDto,
  ) {
    return this.friendLinksService.rejectApplication(id, dto);
  }

  // 管理员：删除申请
  @Delete('admin/friend-links/applications/:id')
  @Roles(Role.ADMIN)
  removeApplication(@Param('id') id: string) {
    return this.friendLinksService.removeApplication(id);
  }
}
