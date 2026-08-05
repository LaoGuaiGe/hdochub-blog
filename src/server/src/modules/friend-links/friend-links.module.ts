// 友链模块
import { Module } from '@nestjs/common';
import { FriendLinksController } from './friend-links.controller';
import { FriendLinksService } from './friend-links.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

@Module({
  controllers: [FriendLinksController],
  providers: [FriendLinksService, RateLimitGuard],
  exports: [FriendLinksService],
})
export class FriendLinksModule {}
