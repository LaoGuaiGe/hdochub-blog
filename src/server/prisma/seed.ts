// hdochub 个人技术博客 - 种子数据脚本
// 初始化超级管理员账号、默认分类、站点设置

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化种子数据...');

  // 1. 创建超级管理员账号
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hdochub.com',
      password: adminPassword,
      nickname: '博主',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      bio: 'hdochub 博主，后端工程师',
    },
  });
  console.log(`超级管理员账号已创建: ${admin.username} (ID: ${admin.id})`);
  console.log('默认密码: Admin@123456 （请在首次登录后修改）');

  // 2. 创建默认分类（依据 PRD 7.1）
  const categories = [
    { name: '技术问题', slug: 'tech-issue', description: '记录工作/学习中遇到的技术问题及解决方案', sort: 1 },
    { name: '教程', slug: 'tutorial', description: '系统性的技术教程与操作指南', sort: 2 },
    { name: '观点', slug: 'opinion', description: '技术观点、行业思考、架构选型讨论', sort: 3 },
    { name: '随笔', slug: 'essay', description: '非纯技术的工作生活记录', sort: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`默认分类已创建: ${categories.map((c) => c.name).join(', ')}`);

  // 3. 创建站点设置（依据 database-design.md 3.9）
  const settings = [
    { key: 'site_title', value: 'hdochub 个人技术博客', description: '站点标题' },
    { key: 'site_subtitle', value: '记录技术问题与思考', description: '副标题' },
    { key: 'site_description', value: '面向工程师的个人技术博客', description: 'SEO meta description' },
    { key: 'site_icp', value: '京ICP备XXXXXXXX号', description: '备案号' },
    { key: 'comment_review_enabled', value: 'false', description: '评论审核开关' },
    { key: 'registration_enabled', value: 'true', description: '注册开关' },
    { key: 'page_size', value: '10', description: '每页文章数' },
    { key: 'admin_path', value: 'admin', description: '管理员后台路径' },
    {
      key: 'about_content',
      value: '# 关于博主\n\n一名后端工程师，热爱开源与技术分享。\n\n本博客用于记录工作生活中的技术问题、解决方案、技术观点和教程。',
      description: '关于页面内容',
    },
    { key: 'site_url', value: 'https://blog.hdochub.com', description: '站点 URL' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`站点设置已初始化: ${settings.length} 项`);

  console.log('\n种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
