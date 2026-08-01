// 评论控制器
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
import { CommentsService } from './comments.service';
import { Public, Roles } from '../../common/decorators';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateCommentDto, AdminCommentQueryDto } from './dto/comment.dto';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // 文章评论列表（公开）
  @Public()
  @Get('articles/:slug/comments')
  findByArticle(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.commentsService.findByArticle(
      slug,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  // 发表评论
  @Post('articles/:slug/comments')
  @Roles(Role.USER)
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60, 'comment')
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.create(slug, dto, user.sub);
  }

  // 删除评论
  @Delete('comments/:id')
  @Roles(Role.USER)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commentsService.remove(id, user.sub);
  }

  // 我收到的评论
  @Get('dashboard/comments')
  @Roles(Role.USER)
  findReceived(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.commentsService.findReceived(
      user.sub,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  // 我发表的评论
  @Get('dashboard/comments/mine')
  @Roles(Role.USER)
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.commentsService.findMine(
      user.sub,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  // 管理员：全站评论列表
  @Get('admin/comments')
  @Roles(Role.ADMIN)
  adminFindList(@Query() query: AdminCommentQueryDto) {
    return this.commentsService.adminFindList(query);
  }

  // 管理员：审核通过
  @Put('admin/comments/:id/approve')
  @Roles(Role.ADMIN)
  adminApprove(@Param('id') id: string) {
    return this.commentsService.adminApprove(id);
  }

  // 管理员：删除评论
  @Delete('admin/comments/:id')
  @Roles(Role.ADMIN)
  adminRemove(@Param('id') id: string) {
    return this.commentsService.adminRemove(id);
  }
}
