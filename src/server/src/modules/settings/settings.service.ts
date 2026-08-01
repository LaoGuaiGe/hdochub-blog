// 站点设置服务
// key-value 存储，应用启动加载到 Redis 缓存
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { UpdateSettingsDto } from './dto/setting.dto';

// 前台可见的公开设置键（不含敏感项）
const PUBLIC_KEYS = [
  'site_title',
  'site_subtitle',
  'site_description',
  'site_icp',
  'site_url',
  'page_size',
  'registration_enabled',
];

// 键名映射：驼峰 <-> snake_case
const KEY_MAP: Record<string, string> = {
  siteTitle: 'site_title',
  siteSubtitle: 'site_subtitle',
  siteDescription: 'site_description',
  siteIcp: 'site_icp',
  siteCommentReviewEnabled: 'comment_review_enabled',
  registrationEnabled: 'registration_enabled',
  pageSize: 'page_size',
  adminPath: 'admin_path',
  aboutContent: 'about_content',
  siteUrl: 'site_url',
};

// 反向映射
const REVERSE_KEY_MAP: Record<string, string> = Object.entries(KEY_MAP).reduce(
  (acc, [camel, snake]) => {
    acc[snake] = camel;
    return acc;
  },
  {} as Record<string, string>,
);

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger('SettingsService');
  private cache: Record<string, string> = {};

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async onModuleInit() {
    await this.loadAll();
  }

  // 加载全部设置到内存
  async loadAll() {
    try {
      const list = await this.prisma.setting.findMany();
      this.cache = {};
      for (const s of list) {
        this.cache[s.key] = s.value || '';
      }
      this.logger.log(`站点设置已加载: ${list.length} 项`);
    } catch (e) {
      this.logger.warn(`加载站点设置失败: ${e.message}（使用默认值）`);
      this.cache = {};
    }
  }

  // 获取单个设置值
  get(key: string): string | null {
    return this.cache[key] ?? null;
  }

  // 获取布尔型设置
  getBool(key: string): boolean {
    return this.cache[key] === 'true';
  }

  // 获取数值型设置
  getNumber(key: string, defaultVal: number = 0): number {
    const v = this.cache[key];
    return v ? Number(v) : defaultVal;
  }

  // 获取前台公开设置
  async getPublicSettings() {
    const result: Record<string, any> = {};
    for (const snakeKey of PUBLIC_KEYS) {
      const camelKey = REVERSE_KEY_MAP[snakeKey] || snakeKey;
      const value = this.cache[snakeKey] ?? '';
      if (snakeKey === 'page_size') {
        result[camelKey] = Number(value) || 10;
      } else if (snakeKey === 'registration_enabled') {
        result[camelKey] = value === 'true';
      } else {
        result[camelKey] = value;
      }
    }
    return result;
  }

  // 更新设置（超管）
  async update(dto: UpdateSettingsDto) {
    const updates: { key: string; value: string }[] = [];
    for (const [camelKey, snakeKey] of Object.entries(KEY_MAP)) {
      if (dto[camelKey as keyof UpdateSettingsDto] !== undefined) {
        const val = dto[camelKey as keyof UpdateSettingsDto];
        let strVal: string;
        if (typeof val === 'boolean') {
          strVal = val ? 'true' : 'false';
        } else if (typeof val === 'number') {
          strVal = String(val);
        } else {
          strVal = String(val ?? '');
        }
        updates.push({ key: snakeKey, value: strVal });
      }
    }

    for (const u of updates) {
      await this.prisma.setting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      });
    }

    // 刷新内存缓存
    await this.loadAll();
    this.logger.log(`站点设置已更新: ${updates.length} 项`);
    return { updated: updates.length };
  }
}
