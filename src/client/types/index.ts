// =========================================================
// 全局类型定义
// =========================================================

export type UserRole = 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN'
export type ArticleStatus = 'PUBLISHED' | 'DRAFT' | 'OFFLINE' | 'DELETED'
export type CommentStatus = 'PENDING' | 'APPROVED' | 'DELETED'
export type UserStatus = 'NORMAL' | 'BANNED'

// 统一响应格式
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页响应（与 API 设计文档一致，分页信息嵌套在 pagination 对象中）
export interface Paginated<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 分页请求
export interface PaginationQuery {
  page?: number
  pageSize?: number
}

// 用户
export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string | null
  bio: string | null
  role: UserRole
  status: UserStatus
  articleCount?: number
  commentCount?: number
  createdAt: string
}

export interface UserProfile extends User {
  postCount: number
  totalViews: number
  totalLikes: number
  commentCount: number
}

// 分类
export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  sort: number
  articleCount?: number
  createdAt: string
}

// 标签
export interface Tag {
  id: number
  name: string
  slug: string
  articleCount?: number
  createdAt: string
}

// 文章
export interface Article {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  coverImage: string | null
  status: ArticleStatus
  author: User
  authorId: number
  category: Category
  categoryId: number
  tags: Tag[]
  viewCount: number
  likeCount: number
  commentCount: number
  wordCount: number
  readTime: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ArticleListItem {
  id: number
  title: string
  slug: string
  excerpt: string
  coverImage: string | null
  status: ArticleStatus
  authorId: number
  authorName: string
  authorAvatar: string | null
  categoryId: number
  categoryName: string
  categorySlug: string
  tags: Tag[]
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string | null
  createdAt: string
}

export interface ArticleListQuery extends PaginationQuery {
  category?: string
  tag?: string
  authorId?: number
  status?: ArticleStatus
  sort?: 'latest' | 'views'
  keyword?: string
}

// 评论
export interface Comment {
  id: number
  articleId: number
  articleTitle?: string
  articleSlug?: string
  authorId: number
  authorName: string
  authorAvatar: string | null
  content: string
  parentId: number | null
  replyTo?: {
    id: number
    name: string
  }
  status: CommentStatus
  depth: number
  children?: Comment[]
  createdAt: string
}

// 点赞
export interface LikeInfo {
  likeCount: number
  liked: boolean
}

// 友链
export interface FriendLink {
  id: number
  name: string
  url: string
  description: string
  logo: string | null
  sort: number
  createdAt: string
}

// 站点设置
export interface SiteSettings {
  title: string
  subtitle: string
  description: string
  icp: string
  commentReview: boolean
  allowRegister: boolean
  pageSize: number
  adminPath: string
}

// 统计
export interface DashboardStats {
  articleCount: number
  totalViews: number
  totalLikes: number
  commentCount: number
}

export interface AdminStats {
  articleCount: number
  userCount: number
  commentCount: number
  todayViews: number
  todayNewUsers: number
  pendingComments: number
  reportedArticles: number
  recentActivities: Array<{
    time: string
    action: string
  }>
}

// 登录/注册
export interface LoginPayload {
  account: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResult {
  token: string
  user: User
}

// 文章创建/编辑
export interface ArticlePayload {
  title: string
  content: string
  categoryId: number
  tags: string[]
  coverImage?: string | null
  excerpt?: string
  status: ArticleStatus
}

// TOC 目录项
export interface TocItem {
  id: string
  text: string
  level: number
}

// 通用选项
export interface SelectOption {
  label: string
  value: string | number
}
