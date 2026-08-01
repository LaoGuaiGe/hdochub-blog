// 用户控制器
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { Public, Roles } from '../../common/decorators';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { UpdateProfileDto } from './dto/user.dto';
import { ArticleQueryDto } from '../articles/dto/article.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 用户主页（公开）
  @Public()
  @Get('users/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  // 用户主页文章列表（公开）
  @Public()
  @Get('users/:username/articles')
  findUserArticles(
    @Param('username') username: string,
    @Query() query: ArticleQueryDto,
  ) {
    return this.usersService.findUserArticles(username, query);
  }

  // 更新个人资料
  @Put('dashboard/profile')
  @Roles(Role.USER)
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  // 上传头像
  @Put('dashboard/avatar')
  @Roles(Role.USER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED) as any,
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.uploadAvatar(user.sub, file);
  }

  // 个人统计概览
  @Get('dashboard/stats')
  @Roles(Role.USER)
  getStats(@CurrentUser() user: JwtPayload) {
    return this.usersService.getStats(user.sub);
  }
}
