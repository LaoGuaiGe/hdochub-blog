// 管理员控制器
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { AdminUserQueryDto, UpdateUserRoleDto } from './dto/admin-user.dto';
import { CreateAdminDto } from '../auth/dto/auth.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 全站统计概览
  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.adminService.getStats();
  }

  // 用户列表
  @Get('users')
  @Roles(Role.ADMIN)
  findUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.findUsers(query);
  }

  // 修改用户角色（仅超级管理员）
  @Put('users/:id/role')
  @Roles(Role.SUPER_ADMIN)
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateUserRole(id, dto, user.sub);
  }

  // 封禁用户
  @Put('users/:id/ban')
  @Roles(Role.ADMIN)
  banUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.banUser(id, user.sub);
  }

  // 解封用户
  @Put('users/:id/unban')
  @Roles(Role.ADMIN)
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  // 重置用户密码
  @Post('users/:id/reset-password')
  @Roles(Role.ADMIN)
  resetPassword(@Param('id') id: string) {
    return this.adminService.resetPassword(id);
  }

  // 创建管理员（仅超级管理员）
  @Post('users')
  @Roles(Role.SUPER_ADMIN)
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }
}
