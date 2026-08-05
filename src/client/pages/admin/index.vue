<script setup lang="ts">
import { userApi } from '~/utils/api'
import { formatNumber, formatDateTime } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { data: stats, pending } = await useAsyncData('admin-stats', () => userApi.adminStats())

const statCards = computed(() => [
  { label: '文章数', value: stats.value?.articleCount || 0 },
  { label: '用户数', value: stats.value?.userCount || 0 },
  { label: '评论数', value: stats.value?.commentCount || 0 },
  { label: '今日阅读', value: formatNumber(stats.value?.todayViews || 0) },
  { label: '今日新增', value: stats.value?.todayNewUsers || 0 }
])

const todos = computed(() => [
  { label: '待审核评论', count: stats.value?.pendingComments || 0, path: '/admin/comments' },
  { label: '举报文章', count: stats.value?.reportedArticles || 0, path: '/admin/posts' },
  { label: '新注册用户', count: stats.value?.todayNewUsers || 0, path: '/admin/users' }
])

const quickLinks = [
  { label: '文章管理', path: '/admin/posts' },
  { label: '用户管理', path: '/admin/users' },
  { label: '评论管理', path: '/admin/comments' },
  { label: '分类管理', path: '/admin/categories' },
  { label: '标签管理', path: '/admin/tags' },
  { label: '资源管理', path: '/admin/resources' },
  { label: '友链管理', path: '/admin/friend-links' },
  { label: '站点设置', path: '/admin/settings' }
]

useHead({ title: '管理员概览 - hdochub' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">ADMIN / 全站概览</h1>
    </div>

    <div v-if="pending" class="border-2 border-black p-6 mb-6">
      <BLoading text="LOADING" full />
    </div>
    <template v-else>
      <!-- 全站统计 -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div v-for="card in statCards" :key="card.label" class="border-2 border-black bg-white p-4">
          <p class="font-mono text-h3 font-bold">{{ card.value }}</p>
          <p class="mt-1 font-mono text-tiny text-ink-700 uppercase">{{ card.label }}</p>
        </div>
      </div>

      <!-- 待办提醒 -->
      <div class="border-2 border-black bg-white mb-6">
        <div class="border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">待办提醒</p>
        </div>
        <div class="divide-y-2 divide-ink-200">
          <NuxtLink
            v-for="todo in todos"
            :key="todo.label"
            :to="todo.path"
            class="flex items-center justify-between px-4 py-3 transition-all duration-fast ease-linear hover:bg-yellow"
          >
            <span class="font-mono text-small font-bold">{{ todo.label }}</span>
            <span class="flex items-center gap-3">
              <span class="bg-yellow border-2 border-black px-2 py-0.5 font-mono text-small font-bold">{{ todo.count }}</span>
              <span class="font-mono text-tiny">去处理 →</span>
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="border-2 border-black bg-white p-4 mb-6">
        <p class="mb-3 font-mono text-small font-bold uppercase border-b-2 border-black pb-2">快捷入口</p>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="link in quickLinks"
            :key="link.path"
            :to="link.path"
            class="btn-secondary"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="border-2 border-black bg-white">
        <div class="border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">最近活动</p>
        </div>
        <table class="brutal-table">
          <tbody>
            <tr v-if="!stats?.recentActivities || stats.recentActivities.length === 0">
              <td class="text-center text-ink-500">NO ACTIVITIES</td>
            </tr>
            <tr v-for="(act, idx) in stats?.recentActivities" :key="idx">
              <td class="w-40 text-tiny text-ink-500">{{ formatDateTime(act.time) }}</td>
              <td class="text-small">{{ act.action }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
