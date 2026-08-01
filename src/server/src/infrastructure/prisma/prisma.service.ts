// Prisma 客户端封装：继承 PrismaClient，实现 onModuleInit/onModuleDestroy 生命周期
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Prisma');
  public connected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Prisma 数据库连接已建立');
    } catch (e) {
      this.logger.warn(
        `Prisma 数据库连接失败: ${e.message}（数据库相关功能将不可用，请检查数据库配置）`,
      );
      this.connected = false;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Prisma 数据库连接已断开');
    } catch (e) {
      this.logger.warn(`Prisma 断开连接失败: ${e.message}`);
    }
  }
}
