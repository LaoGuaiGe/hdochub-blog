// 点赞控制器
import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { LikesService } from './likes.service';
import { Roles } from '../../common/decorators';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('articles/:id/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // 查询点赞状态
  @Get()
  @Roles(Role.USER)
  getStatus(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.likesService.getStatus(id, user.sub);
  }

  // 点赞
  @Post()
  @Roles(Role.USER)
  like(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.likesService.like(id, user.sub);
  }

  // 取消点赞
  @Delete()
  @Roles(Role.USER)
  unlike(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.likesService.unlike(id, user.sub);
  }
}
