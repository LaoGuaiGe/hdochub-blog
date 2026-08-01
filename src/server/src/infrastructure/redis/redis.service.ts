// Redis 客户端封装：基于 ioredis
// 提供 get/set/del/incr 等基础操作，以及限流、阅读量去重等业务辅助方法
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Redis');
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;
    const db = this.configService.get<number>('REDIS_DB', 0);

    this.client = new Redis({
      host,
      port,
      password,
      db,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.error('Redis 连接重试超过 3 次，放弃连接');
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis 连接已建立');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis 连接错误: ${err.message}`);
    });

    // 测试连接
    try {
      await this.client.ping();
    } catch (e) {
      this.logger.warn(`Redis 暂时不可用: ${e.message}（限流与缓存功能将降级）`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis 连接已断开');
    }
  }

  // 基础操作
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (e) {
      this.logger.error(`Redis GET 失败: ${e.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
    } catch (e) {
      this.logger.error(`Redis SET 失败: ${e.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (e) {
      this.logger.error(`Redis DEL 失败: ${e.message}`);
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    try {
      return await this.client.incr(key);
    } catch (e) {
      this.logger.error(`Redis INCR 失败: ${e.message}`);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.expire(key, ttl);
    } catch (e) {
      this.logger.error(`Redis EXPIRE 失败: ${e.message}`);
    }
  }

  // 阅读量去重：同一 IP 30 分钟内多次访问同一文章只计一次
  async recordViewIfNotExists(articleId: string | number | bigint, ip: string): Promise<boolean> {
    if (!this.client) return false;
    const key = `view:${articleId}:${ip}`;
    try {
      // SET NX 只在 key 不存在时设置，返回 OK 表示新设置（计一次阅读）
      const result = await this.client.set(key, '1', 'EX', 1800, 'NX');
      return result === 'OK';
    } catch (e) {
      this.logger.error(`Redis 阅读量去重失败: ${e.message}`);
      return false;
    }
  }

  // 限流计数：返回当前计数，超过 limit 则拒绝
  // windowSeconds 为时间窗口（秒）
  async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; count: number }> {
    if (!this.client) return { allowed: true, count: 0 };
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return { allowed: count <= limit, count };
    } catch (e) {
      this.logger.error(`Redis 限流失败: ${e.message}`);
      // Redis 不可用时放行，避免影响正常业务
      return { allowed: true, count: 0 };
    }
  }

  // JWT 黑名单
  async blacklistToken(jti: string, ttl: number): Promise<void> {
    await this.set(`jwt:blacklist:${jti}`, '1', ttl);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const v = await this.get(`jwt:blacklist:${jti}`);
    return v === '1';
  }
}
