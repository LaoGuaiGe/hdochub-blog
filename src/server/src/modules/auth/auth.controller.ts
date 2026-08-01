// 认证控制器
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public, Roles } from '../../common/decorators';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { RegisterDto, LoginDto, ChangePasswordDto, CreateAdminDto } from './dto/auth.dto';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 注册
  @Public()
  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600, 'register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const result = await this.authService.register(dto, req);
    this.setTokenCookie(req, result);
    return result;
  }

  // 登录
  @Public()
  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60, 'login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(dto, req);
    this.setTokenCookie(req, result);
    return result;
  }

  // 登出
  @Post('logout')
  @Roles(Role.USER)
  async logout(@Req() req: Request) {
    const token = this.extractToken(req);
    await this.authService.logout(token);
    return null;
  }

  // 获取当前用户信息
  @Get('me')
  @Roles(Role.USER)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getCurrentUser(user.sub);
  }

  // 修改密码
  @Put('password')
  @Roles(Role.USER)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const token = this.extractToken(req);
    await this.authService.changePassword(user.sub, dto, token);
    return null;
  }

  // 刷新 Token
  @Post('refresh')
  @Roles(Role.USER)
  async refresh(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    const remember = (req.body as any)?.remember === true;
    return this.authService.refresh(user, remember);
  }

  // 设置 HttpOnly Cookie
  private setTokenCookie(req: Request, result: any) {
    const res = (req as any).res as Response;
    if (res && result.token) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 天
      });
    }
  }

  // 从请求中提取 Token
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    const cookieToken = (req as any).cookies?.access_token;
    return cookieToken || null;
  }
}
