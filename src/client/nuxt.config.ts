// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: true,
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  components: [
    { path: '~/components/common', prefix: '', pathPrefix: false },
    { path: '~/components', pathPrefix: false }
  ],
  css: [
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: 'hdochub 个人技术博客',
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '面向工程师的个人技术博客系统，记录工作生活中的技术问题、解决方案与观点。' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
    pageTransition: false,
    layoutTransition: false
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  nitro: {
    devProxy: {
      '/api/': {
        target: 'http://localhost:4000/api/',
        changeOrigin: true
      },
      '/uploads/': {
        target: 'http://localhost:4000/uploads/',
        changeOrigin: true
      },
      '/rss.xml': {
        target: 'http://localhost:4000/rss.xml',
        changeOrigin: true
      },
      '/sitemap.xml': {
        target: 'http://localhost:4000/sitemap.xml',
        changeOrigin: true
      },
      '/robots.txt': {
        target: 'http://localhost:4000/robots.txt',
        changeOrigin: true
      }
    },
    // 生产环境反向代理（无 Nginx 时由 Nitro 直接代理到后端）
    routeRules: {
      '/api/**': { proxy: 'http://127.0.0.1:4000/api/**' },
      '/uploads/**': { proxy: 'http://127.0.0.1:4000/uploads/**' },
      '/rss.xml': { proxy: 'http://127.0.0.1:4000/rss.xml' },
      '/sitemap.xml': { proxy: 'http://127.0.0.1:4000/sitemap.xml' },
      '/robots.txt': { proxy: 'http://127.0.0.1:4000/robots.txt' }
    }
  },
  typescript: {
    strict: true,
    shim: false
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts'
  },
  pinia: {
    storesDirs: ['./stores/**']
  }
})
