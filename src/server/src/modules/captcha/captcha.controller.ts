// 验证码控制器
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CaptchaService } from './captcha.service';
import { Public } from '../../common/decorators';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  // 获取验证码图片
  @Public()
  @Get()
  async getCaptcha(@Res() res: Response) {
    const { captchaId, svg } = await this.captchaService.generate();
    res.type('image/svg+xml');
    res.setHeader('X-Captcha-Id', captchaId);
    res.send(svg);
  }
}
