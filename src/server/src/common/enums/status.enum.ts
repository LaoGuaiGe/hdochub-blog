// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
  LOCKED = 'LOCKED',
}

// 文章状态枚举
export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

// 评论状态枚举
export enum CommentStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}

// 友链状态枚举
export enum FriendLinkStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
}

// 友链申请状态枚举
export enum FriendLinkApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// 资源状态枚举
export enum ResourceStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  OFFLINE = 'OFFLINE',
}

// 文件用途枚举
export enum FilePurpose {
  AVATAR = 'AVATAR',
  COVER = 'COVER',
  ARTICLE = 'ARTICLE',
}
