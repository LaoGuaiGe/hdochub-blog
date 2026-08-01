// 站点设置控制器
import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums/role.enum';
import { UpdateSettingsDto } from './dto/setting.dto';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // 获取前台公开设置
  @Public()
  @Get('settings')
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  // 更新设置（仅超级管理员）
  @Put('admin/settings')
  @Roles(Role.SUPER_ADMIN)
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
