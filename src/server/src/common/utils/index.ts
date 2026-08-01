// 通用工具函数
import slugify from 'slugify';
import * as crypto from 'crypto';

// 生成 slug：英文用 slugify，中文用 pinyin/拼音缺失时用 hash
export function generateSlug(text: string): string {
  if (!text) return `slug-${randomId(8)}`;
  // 尝试 slugify 英文
  let slug = slugify(text, { lower: true, strict: true, locale: 'en' });
  // 若 slugify 后为空（纯中文），用随机短串
  if (!slug) {
    slug = `post-${randomId(8)}`;
  }
  return slug;
}

// 生成随机 ID（hex）
export function randomId(len: number = 8): string {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}

// 生成 UUID 文件名
export function uuidFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || '';
  return `${crypto.randomUUID()}${ext ? '.' + ext : ''}`;
}

// 计算字数（中英文混合）
export function countWords(text: string): number {
  if (!text) return 0;
  // 去除 markdown 标记与空白
  const plain = text
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/`[^`]*`/g, ' ') // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ') // 链接
    .replace(/[#>*_~\-`]/g, ' ') // 标记符号
    .replace(/\s+/g, ' ')
    .trim();
  // 中文字符数 + 英文单词数
  const chineseCount = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (plain.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) || []).length;
  return chineseCount + englishWords;
}

// 计算预计阅读时长（分钟，向上取整，300 字/分钟）
export function calcReadTime(wordCount: number): number {
  if (!wordCount) return 1;
  return Math.max(1, Math.ceil(wordCount / 300));
}

// 截取摘要
export function extractSummary(content: string, maxLen: number = 200): string {
  if (!content) return '';
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

// 获取客户端 IP
export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.toString().split(',')[0].trim();
  }
  const real = req.headers['x-real-ip'];
  if (real) return real.toString();
  return req.ip || req.connection?.remoteAddress || 'unknown';
}
