// 环境变量配置读取
export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    rememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
  },
  site: {
    url: process.env.SITE_URL || 'http://localhost:4000',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
