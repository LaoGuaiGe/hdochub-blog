// 缓存服务：基于 Redis 的简单缓存工具
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger('Cache');
  // 默认缓存 5 分钟
  private readonly defaultTtl = 300;

  constructor(private redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const v = await this.redisService.get(`cache:${key}`);
    if (!v) return null;
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.redisService.set(
      `cache:${key}`,
      JSON.stringify(value),
      ttl ?? this.defaultTtl,
    );
  }

  async del(key: string): Promise<void> {
    await this.redisService.del(`cache:${key}`);
  }

  // 批量删除匹配前缀的 key（文章更新时清缓存）
  async delByPrefix(prefix: string): Promise<void> {
    // 简单实现：使用 del 列表，生产可用 SCAN
    await this.redisService.del(`cache:${prefix}*`);
  }

  // 缓存包装器：先查缓存，未命中执行 loader 并写入缓存
  async wrap<T>(key: string, loader: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const data = await loader();
    await this.set(key, data, ttl);
    return data;
  }
}
