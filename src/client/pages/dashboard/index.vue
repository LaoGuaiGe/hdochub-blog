<script setup lang="ts">
import { userApi, articleApi, commentApi } from '~/utils/api'
import { formatNumber, formatDate } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { data: stats, pending } = await useAsyncData('user-dashboard', () => userApi.dashboard())
const { data: recentArticles } = await useAsyncData('user-recent-articles', () =>
  articleApi.mine({ page: 1, pageSize: 5 })
)
const { data: recentComments } = await useAsyncData('user-recent-comments', () =>
  commentApi.mine({ page: 1, pageSize: 5 })
)

const statCards = computed(() => [
  { label: '文章数', value: stats.value?.articleCount || 0 },
  { label: '总阅读', value: formatNumber(stats.value?.totalViews || 0) },
  { label: '总点赞', value: formatNumber(stats.value?.totalLikes || 0) },
  { label: '评论数', value: formatNumber(stats.value?.commentCount || 0) }
])

const quickActions = [
  { label: '写文章', path: '/dashboard/editor', primary: true },
  { label: '管理文章', path: '/dashboard/posts' },
  { label: '管理评论', path: '/dashboard/comments' },
  { label: '编辑资料', path: '/dashboard/profile' }
]

useHead({ title: '用户概览 - hdochub' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">DASHBOARD / 我的概览</h1>
    </div>

    <!-- 数据统计 -->
    <div v-if="pending" class="border-2 border-black p-6 mb-6">
      <BLoading text="LOADING" full />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="card in statCards" :key="card.label" class="border-2 border-black bg-white p-4">
        <p class="font-mono text-h3 font-bold">{{ card.value }}</p>
        <p class="mt-1 font-mono text-tiny text-ink-700 uppercase">{{ card.label }}</p>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="border-2 border-black bg-white p-4 mb-6">
      <p class="mb-3 font-mono text-small font-bold uppercase border-b-2 border-black pb-2">快捷操作</p>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.path"
          :to="action.path"
          :class="action.primary ? 'btn-primary' : 'btn-secondary'"
        >
          {{ action.label }}
        </NuxtLink>
      </div>
    </div>

    <!-- 最近文章 + 最近评论 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近文章 -->
      <div class="border-2 border-black bg-white">
        <div class="flex items-center justify-between border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">最近文章</p>
          <NuxtLink to="/dashboard/posts" class="font-mono text-tiny text-yellow border-b-2 border-transparent hover:border-yellow hover:bg-yellow hover:text-black px-1 transition-all duration-fast ease-linear">全部 →</NuxtLink>
        </div>
        <table class="brutal-table">
          <tbody>
            <tr v-if="!recentArticles || recentArticles.list.length === 0">
              <td class="text-center text-ink-500">NO RESULTS</td>
            </tr>
            <tr v-for="a in recentArticles?.list" :key="a.id">
              <td class="font-mono">
                <NuxtLink :to="`/post/${a.slug}`" class="border-b-2 border-transparent hover:border-black hover:bg-black hover:text-white px-1 transition-all duration-fast ease-linear truncate block max-w-[200px]">{{ a.title }}</NuxtLink>
              </td>
              <td class="w-24"><BBadge :status="a.status" /></td>
              <td class="w-24 text-tiny text-ink-500">{{ formatDate(a.publishedAt || a.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 最近评论 -->
      <div class="border-2 border-black bg-white">
        <div class="flex items-center justify-between border-b-2 border-black bg-black px-4 py-2">
          <p class="font-mono text-small font-bold uppercase text-white">最近评论</p>
          <NuxtLink to="/dashboard/comments" class="font-mono text-tiny text-yellow border-b-2 border-transparent hover:border-yellow hover:bg-yellow hover:text-black px-1 transition-all duration-fast ease-linear">全部 →</NuxtLink>
        </div>
        <table class="brutal-table">
          <tbody>
            <tr v-if="!recentComments || recentComments.list.length === 0">
              <td class="text-center text-ink-500">NO RESULTS</td>
            </tr>
            <tr v-for="c in recentComments?.list" :key="c.id">
              <td class="font-mono text-tiny">{{ c.authorName }}</td>
              <td class="font-mono text-tiny truncate max-w-[150px]">{{ c.content }}</td>
              <td class="w-20 text-tiny text-ink-500">{{ formatDate(c.createdAt).slice(5) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
