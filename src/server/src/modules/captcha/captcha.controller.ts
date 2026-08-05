// 验证码控制器
import { Controller, Get } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { Public } from '../../common/decorators';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  // 获取验证码（返回 captchaId + SVG，前端内联渲染）
  @Public()
  @Get()
  async getCaptcha() {
    return this.captchaService.generate();
  }
}
