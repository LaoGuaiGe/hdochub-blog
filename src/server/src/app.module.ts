// 根模块
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';

// 基础设施模块
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { CacheModule } from './infrastructure/cache/cache.module';

// 业务模块
import { AuthModule } from './modules/auth/auth.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { FriendLinksModule } from './modules/friend-links/friend-links.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RssModule } from './modules/rss/rss.module';
import { CaptchaModule } from './modules/captcha/captcha.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),

    // 基础设施
    PrismaModule,
    RedisModule,
    CacheModule,

    // 业务模块
    SettingsModule,
    AuthModule,
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    CommentsModule,
    LikesModule,
    UploadsModule,
    UsersModule,
    AdminModule,
    FriendLinksModule,
    RssModule,
    CaptchaModule,
  ],
})
export class AppModule {}
