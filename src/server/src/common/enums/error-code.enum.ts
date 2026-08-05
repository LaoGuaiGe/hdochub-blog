// 业务错误码定义（5 位数字，前两位表示错误类别）
// 依据 api-design.md 4.2 节
export enum ErrorCode {
  // 成功
  SUCCESS = 0,

  // 客户端通用错误 40xxx
  PARAM_ERROR = 40000,
  VALIDATION_ERROR = 40001,
  ARTICLE_TITLE_INVALID = 40002,
  ACCOUNT_LOCKED = 40003,
  LOGIN_FAILED = 40004,
  OLD_PASSWORD_WRONG = 40005,
  USERNAME_TAKEN = 40006,
  EMAIL_TAKEN = 40007,
  CAPTCHA_WRONG = 40008,
  CATEGORY_NOT_EMPTY = 40009,
  TAG_LIMIT_EXCEEDED = 40010,
  REGISTRATION_CLOSED = 40011,

  // 认证错误 401xx
  UNAUTHORIZED = 40101,
  TOKEN_INVALID = 40102,

  // 权限错误 403xx
  FORBIDDEN_RESOURCE = 40301,
  REQUIRE_ADMIN = 40302,
  REQUIRE_SUPER_ADMIN = 40303,
  ACCOUNT_BANNED = 40304,
  CANNOT_OPERATE_SUPER_ADMIN = 40305,

  // 资源不存在 404xx
  ARTICLE_NOT_FOUND = 40401,
  CATEGORY_NOT_FOUND = 40402,
  TAG_NOT_FOUND = 40403,
  COMMENT_NOT_FOUND = 40404,
  USER_NOT_FOUND = 40405,
  RESOURCE_NOT_FOUND = 40406,
  APPLICATION_NOT_FOUND = 40407,

  // 冲突 409xx
  ALREADY_LIKED = 40901,
  DUPLICATE_COMMENT = 40902,

  // 文件上传 413xx / 415xx
  FILE_TOO_LARGE = 41301,
  FILE_TYPE_NOT_SUPPORTED = 41501,

  // 限流 429xx
  RATE_LIMIT = 42901,

  // 服务端错误 50xxx
  INTERNAL_ERROR = 50000,
  DB_ERROR = 50001,
  UPLOAD_FAILED = 50002,
  MARKDOWN_RENDER_FAILED = 50003,
}

// 错误码默认消息映射
export const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.SUCCESS]: 'success',
  [ErrorCode.PARAM_ERROR]: '请求参数错误',
  [ErrorCode.VALIDATION_ERROR]: '参数校验失败',
  [ErrorCode.ARTICLE_TITLE_INVALID]: '标题长度需在 1-100 字符之间',
  [ErrorCode.ACCOUNT_LOCKED]: '账号已锁定，请 15 分钟后重试',
  [ErrorCode.LOGIN_FAILED]: '用户名或密码错误',
  [ErrorCode.OLD_PASSWORD_WRONG]: '原密码不正确',
  [ErrorCode.USERNAME_TAKEN]: '用户名已被占用',
  [ErrorCode.EMAIL_TAKEN]: '邮箱已被注册',
  [ErrorCode.CAPTCHA_WRONG]: '验证码错误',
  [ErrorCode.CATEGORY_NOT_EMPTY]: '该分类下还有文章，无法删除',
  [ErrorCode.TAG_LIMIT_EXCEEDED]: '每篇文章最多 10 个标签',
  [ErrorCode.REGISTRATION_CLOSED]: '注册已关闭',
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期',
  [ErrorCode.TOKEN_INVALID]: 'Token 已失效，请重新登录',
  [ErrorCode.FORBIDDEN_RESOURCE]: '无权操作此资源',
  [ErrorCode.REQUIRE_ADMIN]: '需要管理员权限',
  [ErrorCode.REQUIRE_SUPER_ADMIN]: '需要超级管理员权限',
  [ErrorCode.ACCOUNT_BANNED]: '账号已被封禁',
  [ErrorCode.CANNOT_OPERATE_SUPER_ADMIN]: '不可操作超级管理员',
  [ErrorCode.ARTICLE_NOT_FOUND]: '文章不存在',
  [ErrorCode.CATEGORY_NOT_FOUND]: '分类不存在',
  [ErrorCode.TAG_NOT_FOUND]: '标签不存在',
  [ErrorCode.COMMENT_NOT_FOUND]: '评论不存在',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [ErrorCode.APPLICATION_NOT_FOUND]: '申请不存在',
  [ErrorCode.ALREADY_LIKED]: '已点赞，请勿重复操作',
  [ErrorCode.DUPLICATE_COMMENT]: '评论内容重复',
  [ErrorCode.FILE_TOO_LARGE]: '文件大小超过限制（最大 5MB）',
  [ErrorCode.FILE_TYPE_NOT_SUPPORTED]: '不支持的文件类型',
  [ErrorCode.RATE_LIMIT]: '请求过于频繁，请稍后再试',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.DB_ERROR]: '数据库操作失败',
  [ErrorCode.UPLOAD_FAILED]: '文件上传失败',
  [ErrorCode.MARKDOWN_RENDER_FAILED]: 'Markdown 渲染失败',
};
