// RSS 服务：生成 RSS 2.0 feed XML
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ArticleStatus } from '../../common/enums/status.enum';
import { escapeHtml } from '../../common/utils/markdown';

@Injectable()
export class RssService {
  private readonly logger = new Logger('RssService');

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // 生成全站 RSS
  async generateRss(categorySlug?: string): Promise<string> {
    const siteUrl = this.configService.get<string>('site.url') || 'http://localhost:4000';
    const siteTitle = 'hdochub 个人技术博客';
    const siteDescription = '面向工程师的个人技术博客';

    let where: any = { status: ArticleStatus.PUBLISHED };
    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    const articles = await this.prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        publishedAt: true,
        category: { select: { name: true } },
        author: { select: { username: true, nickname: true } },
      },
    });

    const items = articles
      .map((a) => {
        const url = `${siteUrl}/post/${a.slug}`;
        const pubDate = a.publishedAt
          ? a.publishedAt.toUTCString()
          : new Date().toUTCString();
        const description = escapeHtml(a.summary || a.content.slice(0, 200));
        return `    <item>
      <title>${escapeHtml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <category>${escapeHtml(a.category?.name || '')}</category>
      <author>${escapeHtml(a.author?.nickname || a.author?.username || '')}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join('\n');

    const lastBuild = articles[0]?.publishedAt?.toUTCString() || new Date().toUTCString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(siteTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeHtml(siteDescription)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>hdochub-blog-server</generator>
${items}
  </channel>
</rss>`;
  }

  // 生成 sitemap.xml
  async generateSitemap(): Promise<string> {
    const siteUrl = this.configService.get<string>('site.url') || 'http://localhost:4000';

    const [articles, categories, tags] = await Promise.all([
      this.prisma.article.findMany({
        where: { status: ArticleStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        select: { slug: true, publishedAt: true, updatedAt: true },
      }),
      this.prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      this.prisma.tag.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

    const staticUrls = [
      `${siteUrl}/`,
      `${siteUrl}/archive`,
      `${siteUrl}/search`,
      `${siteUrl}/about`,
      `${siteUrl}/links`,
    ];

    const staticXml = staticUrls
      .map(
        (u) => `  <url>
    <loc>${u}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`,
      )
      .join('\n');

    const articleXml = articles
      .map((a) => {
        const lastmod = (a.updatedAt || a.publishedAt)?.toISOString();
        return `  <url>
    <loc>${siteUrl}/post/${a.slug}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      })
      .join('\n');

    const categoryXml = categories
      .map(
        (c) => `  <url>
    <loc>${siteUrl}/category/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
      )
      .join('\n');

    const tagXml = tags
      .map(
        (t) => `  <url>
    <loc>${siteUrl}/tag/${t.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${articleXml}
${categoryXml}
${tagXml}
</urlset>`;
  }
}
