// 验证码服务（P2 防垃圾注册）
// 生成图形验证码 SVG，存入 Redis，校验时比对
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger('CaptchaService');
  // 验证码 5 分钟有效
  private readonly TTL = 300;

  constructor(private redisService: RedisService) {}

  // 生成验证码：返回 SVG 图片 + captchaId
  async generate(): Promise<{ captchaId: string; svg: string }> {
    const code = this.randomCode(4);
    const captchaId = `captcha-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await this.redisService.set(`captcha:${captchaId}`, code.toLowerCase(), this.TTL);
    const svg = this.generateSvg(code);
    return { captchaId, svg };
  }

  // 校验验证码
  async verify(captchaId: string, code: string): Promise<boolean> {
    if (!captchaId || !code) return false;
    const stored = await this.redisService.get(`captcha:${captchaId}`);
    if (!stored) return false;
    // 不区分大小写
    const ok = stored === code.toLowerCase();
    if (ok) {
      // 校验后删除，防止复用
      await this.redisService.del(`captcha:${captchaId}`);
    }
    return ok;
  }

  // 生成随机验证码（去除易混淆字符）
  private randomCode(len: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < len; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // 生成简单 SVG 验证码图片
  private generateSvg(code: string): string {
    const width = 120;
    const height = 40;
    const fontSize = 24;
    const chars = code.split('');
    const charSpans = chars
      .map((c, i) => {
        const x = 20 + i * 25;
        const y = 28 + Math.floor(Math.random() * 6) - 3;
        const rotate = Math.floor(Math.random() * 20) - 10;
        return `<text x="${x}" y="${y}" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="#000" transform="rotate(${rotate} ${x} ${y})">${c}</text>`;
      })
      .join('');

    // 干扰线
    let lines = '';
    for (let i = 0; i < 4; i++) {
      const x1 = Math.floor(Math.random() * width);
      const y1 = Math.floor(Math.random() * height);
      const x2 = Math.floor(Math.random() * width);
      const y2 = Math.floor(Math.random() * height);
      lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1" opacity="0.3"/>`;
    }

    // 干扰点
    let dots = '';
    for (let i = 0; i < 20; i++) {
      const cx = Math.floor(Math.random() * width);
      const cy = Math.floor(Math.random() * height);
      dots += `<circle cx="${cx}" cy="${cy}" r="1" fill="#000" opacity="0.3"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#fff" stroke="#000" stroke-width="2"/>
      ${lines}
      ${dots}
      ${charSpans}
    </svg>`;
  }
}
