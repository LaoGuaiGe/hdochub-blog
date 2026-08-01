import { get, post, put, del } from '~/utils/request'
import type {
  Article,
  ArticleListItem,
  ArticleListQuery,
  Paginated,
  Category,
  Tag,
  Comment,
  User,
  FriendLink,
  SiteSettings,
  DashboardStats,
  AdminStats,
  LoginPayload,
  RegisterPayload,
  AuthResult,
  ArticlePayload,
  LikeInfo
} from '~/types'

// ========== 认证 ==========
export const authApi = {
  login: (payload: LoginPayload) => post<AuthResult>('/auth/login', payload),
  register: (payload: RegisterPayload) => post<AuthResult>('/auth/register', payload),
  logout: () => post('/auth/logout'),
  me: () => get<User>('/auth/me')
}

// ========== 文章 ==========
export const articleApi = {
  list: (query: ArticleListQuery) => get<Paginated<ArticleListItem>>('/articles', query),
  detail: (slug: string) => get<Article>(`/articles/${slug}`),
  create: (payload: ArticlePayload) => post<Article>('/articles', payload),
  update: (id: number, payload: Partial<ArticlePayload>) => put<Article>(`/articles/${id}`, payload),
  delete: (id: number) => del(`/articles/${id}`),
  // BUG-004: 我的文章列表路径 /articles/mine -> /dashboard/articles
  mine: (query: ArticleListQuery) => get<Paginated<ArticleListItem>>('/dashboard/articles', query),
  // BUG-005: 下架/恢复文章路径修正（管理员接口）
  offline: (id: number) => put(`/admin/articles/${id}/archive`),
  restore: (id: number) => put(`/admin/articles/${id}/restore`),
  // 发布/转草稿（作者接口，用于 BUG-006 状态切换）
  publish: (id: number) => put(`/articles/${id}/publish`),
  unpublish: (id: number) => put(`/articles/${id}/unpublish`),
  like: (id: number) => post<LikeInfo>(`/articles/${id}/like`),
  unlike: (id: number) => del<LikeInfo>(`/articles/${id}/like`),
  related: (slug: string) => get<ArticleListItem[]>(`/articles/${slug}/related`),
  // BUG-017: 上一页/下一页
  adjacent: (slug: string) => get<{ prev: { id: number; title: string; slug: string } | null; next: { id: number; title: string; slug: string } | null }>(`/articles/${slug}/adjacent`)
}

// ========== 分类 ==========
export const categoryApi = {
  list: () => get<Category[]>('/categories'),
  create: (data: { name: string; description?: string; sort?: number }) => post<Category>('/admin/categories', data),
  // BUG-007: 更新/删除分类路径 /categories/:id -> /admin/categories/:id
  update: (id: number, data: Partial<Category>) => put<Category>(`/admin/categories/${id}`, data),
  delete: (id: number) => del(`/admin/categories/${id}`),
  articles: (slug: string, query: ArticleListQuery) => get<Paginated<ArticleListItem>>(`/categories/${slug}/articles`, query)
}

// ========== 标签 ==========
export const tagApi = {
  list: () => get<Tag[]>('/tags'),
  create: (name: string) => post<Tag>('/admin/tags', { name }),
  // BUG-008: 更新/合并/删除标签路径 /tags/... -> /admin/tags/...
  update: (id: number, name: string) => put<Tag>(`/admin/tags/${id}`, { name }),
  merge: (sourceId: number, targetId: number) => post(`/admin/tags/merge`, { sourceId, targetId }),
  delete: (id: number) => del(`/admin/tags/${id}`),
  articles: (slug: string, query: ArticleListQuery) => get<Paginated<ArticleListItem>>(`/tags/${slug}/articles`, query)
}

// ========== 评论 ==========
export const commentApi = {
  // BUG-009: 评论列表/发表评论使用 slug 而非 articleId
  list: (slug: string) => get<Paginated<Comment>>(`/articles/${slug}/comments`),
  create: (slug: string, payload: { content: string; parentId?: number | null }) =>
    post<Comment>(`/articles/${slug}/comments`, payload),
  delete: (id: number) => del(`/comments/${id}`),
  // BUG-010: 我的评论路径 /comments/mine -> /dashboard/comments/mine
  mine: (query: { page?: number; pageSize?: number }) => get<Paginated<Comment>>('/dashboard/comments/mine', query),
  // BUG-010: 管理员评论列表 /comments -> /admin/comments
  all: (query: { page?: number; pageSize?: number; status?: string; articleId?: number }) =>
    get<Paginated<Comment>>('/admin/comments', query),
  // BUG-010: 审核评论 /comments/:id/approve -> /admin/comments/:id/approve
  approve: (id: number) => put(`/admin/comments/${id}/approve`),
  // BUG-012: 屏蔽评论者 /users/:userId/ban -> /admin/users/:id/ban
  banUser: (userId: number) => put(`/admin/users/${userId}/ban`)
}

// ========== 用户 ==========
export const userApi = {
  // BUG-013: 个人资料 /users/profile -> /auth/me（返回 User 结构）
  profile: () => get<User>('/auth/me'),
  // BUG-013: 更新个人资料 /users/profile -> /dashboard/profile
  updateProfile: (data: { nickname?: string; bio?: string; avatar?: string | null }) =>
    put<User>('/dashboard/profile', data),
  // BUG-001: 修改密码 /users/password -> /auth/password
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    put('/auth/password', data),
  // BUG-013: 个人统计 /users/dashboard -> /dashboard/stats
  dashboard: () => get<DashboardStats>('/dashboard/stats'),
  // BUG-012: 用户列表 /users -> /admin/users
  list: (query: { page?: number; pageSize?: number; role?: string; status?: string }) =>
    get<Paginated<User>>('/admin/users', query),
  // BUG-012: 修改角色 /users/:id/role -> /admin/users/:id/role
  updateRole: (id: number, role: string) => put(`/admin/users/${id}/role`, { role }),
  // BUG-012: 封禁/解封 /users/:id/ban -> /admin/users/:id/ban
  ban: (id: number) => put(`/admin/users/${id}/ban`),
  unban: (id: number) => put(`/admin/users/${id}/unban`),
  // BUG-011: 重置密码 PUT /users/:id/reset-password -> POST /admin/users/:id/reset-password
  resetPassword: (id: number) => post(`/admin/users/${id}/reset-password`),
  adminStats: () => get<AdminStats>('/admin/stats')
}

// ========== 搜索 ==========
export const searchApi = {
  // BUG-003: 搜索参数 keyword -> q
  articles: (keyword: string, query: { page?: number; pageSize?: number }) =>
    get<Paginated<ArticleListItem>>('/search', { q: keyword, ...query })
}

// ========== 归档 ==========
export const archiveApi = {
  list: () => get<Array<{ year: number; month: number; items: ArticleListItem[] }>>('/archive')
}

// ========== 友链 ==========
export const friendLinkApi = {
  list: () => get<FriendLink[]>('/friend-links'),
  // BUG-016: 创建/更新/删除友链路径 /friend-links/... -> /admin/friend-links/...
  create: (data: Omit<FriendLink, 'id' | 'createdAt'>) => post<FriendLink>('/admin/friend-links', data),
  update: (id: number, data: Partial<FriendLink>) => put<FriendLink>(`/admin/friend-links/${id}`, data),
  delete: (id: number) => del(`/admin/friend-links/${id}`)
}

// ========== 站点设置 ==========
export const settingsApi = {
  get: () => get<SiteSettings>('/settings'),
  // BUG-014: 更新设置 /settings -> /admin/settings
  update: (data: Partial<SiteSettings>) => put<SiteSettings>('/admin/settings', data)
}

// ========== 静态页面 ==========
export const pageApi = {
  about: () => get<{ content: string }>('/pages/about')
}

// ========== 上传 ==========
export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return post<{ url: string }>('/uploads', formData)
  }
}

export const api = {
  auth: authApi,
  article: articleApi,
  category: categoryApi,
  tag: tagApi,
  comment: commentApi,
  user: userApi,
  search: searchApi,
  archive: archiveApi,
  friendLink: friendLinkApi,
  settings: settingsApi,
  page: pageApi,
  upload: uploadApi
}

export type Api = typeof api
