// 文章控制器
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ArticlesService } from './articles.service';
import { Public, Roles } from '../../common/decorators';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
  AdminArticleQueryDto,
  MyArticleQueryDto,
  BatchArticleDto,
} from './dto/article.dto';
import { getClientIp } from '../../common/utils';

@Controller()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // 公开文章列表
  @Public()
  @Get('articles')
  findAll(@Query() query: ArticleQueryDto, @Req() req: Request) {
    return this.articlesService.findPublishedList(query, getClientIp(req));
  }

  // 热门文章
  @Public()
  @Get('articles/hot')
  findHot(@Query('limit') limit?: string) {
    return this.articlesService.findHot(limit ? Number(limit) : 5);
  }

  // 文章详情
  @Public()
  @Get('articles/:slug')
  async findOne(
    @Param('slug') slug: string,
    @Req() req: Request,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.articlesService.findBySlug(slug, getClientIp(req), user?.sub);
  }

  // 相关文章
  @Public()
  @Get('articles/:slug/related')
  findRelated(@Param('slug') slug: string) {
    return this.articlesService.findRelated(slug);
  }

  // 上一页/下一页
  @Public()
  @Get('articles/:slug/adjacent')
  findAdjacent(@Param('slug') slug: string) {
    return this.articlesService.findAdjacent(slug);
  }

  // 创建文章
  @Post('articles')
  @Roles(Role.USER)
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: JwtPayload) {
    return this.articlesService.create(dto, user.sub);
  }

  // 更新文章
  @Put('articles/:id')
  @Roles(Role.USER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.articlesService.update(id, dto, user.sub);
  }

  // 删除文章
  @Delete('articles/:id')
  @Roles(Role.USER)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.articlesService.remove(id, user.sub);
  }

  // 发布草稿
  @Put('articles/:id/publish')
  @Roles(Role.USER)
  publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.articlesService.publish(id, user.sub);
  }

  // 转为草稿
  @Put('articles/:id/unpublish')
  @Roles(Role.USER)
  unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.articlesService.unpublish(id, user.sub);
  }

  // 我的文章列表
  @Get('dashboard/articles')
  @Roles(Role.USER)
  findMyList(
    @Query() query: MyArticleQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.articlesService.findMyList(query, user.sub);
  }

  // 归档
  @Public()
  @Get('archive')
  findArchive() {
    return this.articlesService.findArchive();
  }

  // 搜索
  @Public()
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.articlesService.search(
      q,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  // 管理员：全站文章列表
  @Get('admin/articles')
  @Roles(Role.ADMIN)
  adminFindList(@Query() query: AdminArticleQueryDto) {
    return this.articlesService.adminFindList(query);
  }

  // 管理员：下架文章
  @Put('admin/articles/:id/archive')
  @Roles(Role.ADMIN)
  adminArchive(@Param('id') id: string) {
    return this.articlesService.adminArchive(id);
  }

  // 管理员：恢复上架
  @Put('admin/articles/:id/restore')
  @Roles(Role.ADMIN)
  adminRestore(@Param('id') id: string) {
    return this.articlesService.adminRestore(id);
  }

  // 管理员：批量操作
  @Post('admin/articles/batch')
  @Roles(Role.ADMIN)
  adminBatch(@Body() dto: BatchArticleDto) {
    return this.articlesService.adminBatch(dto);
  }
}
