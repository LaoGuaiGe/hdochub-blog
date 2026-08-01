// hdochub 博客系统 PM2 进程管理配置
// 使用方式：pm2 start ecosystem.config.js
// 注意：本文件放置在后端工程根目录，前端应用通过 cwd 指向路径

module.exports = {
  apps: [
    // ===== 前端 Nuxt 3 SSR 服务 =====
    {
      name: 'blog-web',
      script: 'node_modules/.bin/nuxt',
      args: 'start',
      cwd: '/www/wwwroot/blog.hdochub.com/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3000,
        NUXT_PUBLIC_API_BASE: 'https://blog.hdochub.com/api',
        NUXT_PUBLIC_SITE_URL: 'https://blog.hdochub.com',
      },
      // 内存超过 500M 自动重启，防止内存泄漏
      max_memory_restart: '500M',
      // 日志配置
      error_file: '/www/wwwlogs/pm2/blog-web-error.log',
      out_file: '/www/wwwlogs/pm2/blog-web-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      // 自动重启配置
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      // 异常退出延迟重启，避免频繁重启
      min_uptime: '10s',
      // 监听变更（生产环境不需要，部署时手动 restart）
      watch: false,
    },

    // ===== 后端 NestJS API 服务 =====
    {
      name: 'blog-server',
      script: 'dist/main.js',
      cwd: '/www/wwwroot/blog.hdochub.com/server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 4000,
      },
      // 内存超过 500M 自动重启
      max_memory_restart: '500M',
      // 日志配置
      error_file: '/www/wwwlogs/pm2/blog-server-error.log',
      out_file: '/www/wwwlogs/pm2/blog-server-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
      // 自动重启配置
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      min_uptime: '10s',
      watch: false,
    },
  ],

  // ===== 部署配置（可选，用于 pm2 deploy） =====
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/hdochub-blog.git',
      path: '/www/wwwroot/blog.hdochub.com',
      'pre-deploy-local': '',
      'post-deploy':
        'cd server && pnpm install --prod && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build && cd ../web && pnpm install && pnpm build && cd .. && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
