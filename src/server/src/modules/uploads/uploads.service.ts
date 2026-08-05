// 文件上传服务
// 安全校验：MIME 白名单、文件头校验、5MB 限制、UUID 重命名
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { FilePurpose } from '../../common/enums/status.enum';
import { uuidFileName } from '../../common/utils';

// 允许的 MIME 类型白名单
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

// 文件头魔数校验（防伪造 MIME）
const MAGIC_NUMBERS: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger('UploadsService');

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    purpose?: string,
  ) {
    if (!file) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '文件不能为空');
    }

    // 校验大小
    const maxSize = this.configService.get<number>('upload.maxSize') || 5242880;
    if (file.size > maxSize) {
      throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
    }

    // 校验 MIME 类型
    const mimeType = file.mimetype;
    if (!ALLOWED_MIME[mimeType]) {
      throw new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED);
    }

    // 校验文件头
    if (!this.verifyMagicNumber(file.buffer, mimeType)) {
      throw new BusinessException(ErrorCode.FILE_TYPE_NOT_SUPPORTED, '文件内容与类型不匹配');
    }

    // 生成存储路径：uploads/YYYY/MM/uuid.ext
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = this.configService.get<string>('upload.dir') || './uploads';
    const relativeDir = path.join(String(year), month);
    const absoluteDir = path.join(uploadDir, relativeDir);

    // 创建目录
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    // 生成文件名
    const ext = ALLOWED_MIME[mimeType];
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(absoluteDir, fileName);
    const relativePath = path.join(relativeDir, fileName).replace(/\\/g, '/');

    // 写入文件
    try {
      fs.writeFileSync(filePath, file.buffer);
    } catch (e) {
      this.logger.error(`文件写入失败: ${e.message}`);
      throw new BusinessException(ErrorCode.UPLOAD_FAILED);
    }

    // 生成访问 URL（返回相对路径，便于在任意域名/代理下访问）
    const fileUrl = `/uploads/${relativePath}`;

    // 获取图片尺寸（简化：不解析，返回 null）
    const width = null;
    const height = null;

    // 记录到数据库
    const record = await this.prisma.uploadFile.create({
      data: {
        userId: BigInt(userId),
        originalName: file.originalname,
        storedName: fileName,
        filePath: relativePath,
        fileUrl,
        fileSize: file.size,
        mimeType,
        width,
        height,
        purpose: purpose || null,
      },
    });

    return {
      id: Number(record.id),
      url: fileUrl,
      fileName,
      size: file.size,
      width,
      height,
    };
  }

  // 文件头魔数校验
  private verifyMagicNumber(buffer: Buffer, mimeType: string): boolean {
    const magics = MAGIC_NUMBERS[mimeType];
    if (!magics) return false;
    return magics.some((magic) => buffer.slice(0, magic.length).equals(magic));
  }
}
