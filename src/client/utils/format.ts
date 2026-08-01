// 格式化工具函数

/**
 * 格式化数字为带单位字符串（如 1.2k, 3.4w）
 */
export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return String(num)
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const date = formatDate(dateStr)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${h}:${min}`
}

/**
 * 相对时间（如 "2小时前"）
 */
export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)
  const month = Math.floor(day / 30)
  const year = Math.floor(day / 365)
  if (year > 0) return `${year}年前`
  if (month > 0) return `${month}个月前`
  if (day > 0) return `${day}天前`
  if (hour > 0) return `${hour}小时前`
  if (min > 0) return `${min}分钟前`
  return '刚刚'
}

/**
 * 计算字数（中文按字，英文按词）
 */
export function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) || []).length
  return chineseChars + englishWords
}

/**
 * 计算预计阅读时长（分钟）
 */
export function readTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 300))
}

/**
 * 截断字符串
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * 获取用户名首字母（用于头像）
 */
export function getInitial(name: string): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

/**
 * 高亮关键词（返回带标记的 HTML 片段）
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const pattern = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
  return escaped.replace(pattern, '<mark class="bg-yellow text-black">$1</mark>')
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 状态映射
 */
export const statusLabel: Record<string, string> = {
  PUBLISHED: '已发布',
  DRAFT: '草稿',
  OFFLINE: '已下架',
  DELETED: '已删除',
  PENDING: '待审核',
  APPROVED: '已通过',
  NORMAL: '正常',
  BANNED: '封禁'
}

/**
 * 密码强度计算 1-4
 */
export function passwordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  return Math.min(4, score)
}
