// RSS 控制器
import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { RssService } from './rss.service';
import { Public } from '../../common/decorators';

@Controller()
export class RssController {
  constructor(private readonly rssService: RssService) {}

  // 全站 RSS
  @Public()
  @Get('rss.xml')
  async rss(@Res() res: Response) {
    const xml = await this.rssService.generateRss();
    res.type('application/xml');
    res.send(xml);
  }

  // 按分类 RSS
  @Public()
  @Get('rss/:categorySlug.xml')
  async rssByCategory(
    @Param('categorySlug') categorySlug: string,
    @Res() res: Response,
  ) {
    const xml = await this.rssService.generateRss(categorySlug);
    res.type('application/xml');
    res.send(xml);
  }

  // sitemap
  @Public()
  @Get('sitemap.xml')
  async sitemap(@Res() res: Response) {
    const xml = await this.rssService.generateSitemap();
    res.type('application/xml');
    res.send(xml);
  }

  // robots.txt
  @Public()
  @Get('robots.txt')
  robots(@Res() res: Response) {
    const siteUrl = process.env.SITE_URL || 'http://localhost:4000';
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /api/auth
Disallow: /api/dashboard

Sitemap: ${siteUrl}/sitemap.xml`);
  }
}
