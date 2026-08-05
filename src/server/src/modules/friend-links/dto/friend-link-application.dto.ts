// 友链申请 DTO
import {
  IsString,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

// 公开提交友链申请
export class CreateFriendLinkApplicationDto {
  @IsString()
  @MinLength(1, { message: '站点名称不能为空' })
  @MaxLength(50, { message: '站点名称最多 50 字符' })
  name: string;

  @IsString()
  @IsUrl({}, { message: '网站地址格式不正确' })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '网站描述最多 500 字符' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '个人名称最多 50 字符' })
  contactName?: string;
}

// 管理员审核：拒绝时可填拒绝理由
export class ReviewFriendLinkApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rejectReason?: string;
}
