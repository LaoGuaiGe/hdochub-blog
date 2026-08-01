// 环境变量校验 schema（Joi）
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),

  DATABASE_URL: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REMEMBER_EXPIRES_IN: Joi.string().default('30d'),

  UPLOAD_DIR: Joi.string().default('./uploads'),
  UPLOAD_MAX_SIZE: Joi.number().default(5242880),

  SITE_URL: Joi.string().default('http://localhost:4000'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
});
