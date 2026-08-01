<script setup lang="ts">
import type { ArticleStatus } from '~/types'
import { articleApi } from '~/utils/api'
import { formatDate, formatNumber } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const page = ref(Number(route.query.page) || 1)
const searchKeyword = ref((route.query.keyword as string) || '')
const authorFilter = ref((route.query.author as string) || '')
const categoryFilter = ref((route.query.category as string) || '')
const statusFilter = ref<'ALL' | ArticleStatus>((route.query.status as any) || 'ALL')

const query = computed(() => ({
  page: page.value,
  pageSize: 20,
  keyword: searchKeyword.value || undefined,
  authorId: authorFilter.value ? Number(authorFilter.value) : undefined,
  category: categoryFilter.value || undefined,
  status: statusFilter.value === 'ALL' ? undefined : statusFilter.value
}))

const { data, pending, refresh } = await useAsyncData(
  () => `admin-articles-${page.value}-${searchKeyword.value}-${authorFilter.value}-${categoryFilter.value}-${statusFilter.value}`,
  () => articleApi.list(query.value),
  { watch: [page, searchKeyword, authorFilter, categoryFilter, statusFilter] }
)

const list = computed(() => data.value?.list || [])
const totalPages = computed(() => data.value?.pagination.totalPages || 0)

const statusTabs = [
  { label: '全部', value: 'ALL' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已下架', value: 'OFFLINE' }
]

function changeTab(tab: 'ALL' | ArticleStatus) {
  statusFilter.value = tab
  page.value = 1
}

function onSearch() {
  page.value = 1
}

function changePage(p: number) {
  page.value = p
}

async function handleDelete(article: any) {
  const ok = await confirm({
    title: '删除文章',
    message: `确认删除文章「${article.title}」？此操作不可恢复。`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await articleApi.delete(article.id)
    success('文章已删除')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}

async function handleOffline(article: any) {
  try {
    await articleApi.offline(article.id)
    success('文章已下架')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

async function handleRestore(article: any) {
  try {
    await articleApi.restore(article.id)
    success('文章已恢复上架')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

const columns = [
  { key: 'title', title: '标题' },
  { key: 'authorName', title: '作者', hideOnMobile: true },
  { key: 'categoryName', title: '分类', hideOnMobile: true },
  { key: 'status', title: '状态' },
  { key: 'viewCount', title: '阅读', hideOnTablet: true },
  { key: 'likeCount', title: '点赞', hideOnTablet: true },
  { key: 'commentCount', title: '评论', hideOnTablet: true },
  { key: 'publishedAt', title: '时间', hideOnTablet: true },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '文章管理 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">文章管理 / 全站文章</h1>
    </div>

    <!-- 搜索筛选 -->
    <div class="border-2 border-black bg-white p-3 mb-4 flex flex-wrap items-center gap-2">
      <div class="flex-1 min-w-[200px]">
        <BSearchBar v-model="searchKeyword" size="small" placeholder="搜索标题..." @search="onSearch" />
      </div>
      <div class="flex items-center gap-0">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="border-2 border-black px-3 py-1 font-mono text-tiny font-bold uppercase transition-all duration-fast ease-linear"
          :class="[
            statusFilter === tab.value ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white',
            tab.value !== 'ALL' ? 'border-l-0' : ''
          ]"
          @click="changeTab(tab.value as any)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <BTable :columns="columns" :data="list" :loading="pending">
      <template #title="{ row }">
        <NuxtLink :to="`/post/${row.slug}`" class="font-mono text-small border-b-2 border-transparent hover:border-black hover:bg-black hover:text-white px-1 transition-all duration-fast ease-linear truncate block max-w-[180px]">
          {{ row.title }}
        </NuxtLink>
      </template>
      <template #status="{ row }">
        <BBadge :status="row.status" />
      </template>
      <template #viewCount="{ row }">{{ formatNumber(row.viewCount) }}</template>
      <template #likeCount="{ row }">{{ formatNumber(row.likeCount) }}</template>
      <template #commentCount="{ row }">{{ formatNumber(row.commentCount) }}</template>
      <template #publishedAt="{ row }">{{ formatDate(row.publishedAt || row.createdAt) }}</template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <NuxtLink :to="`/dashboard/editor?slug=${row.slug}`" class="btn-text !text-tiny">编辑</NuxtLink>
          <button v-if="row.status === 'PUBLISHED'" class="btn-text !text-tiny" @click="handleOffline(row)">下架</button>
          <button v-else-if="row.status === 'OFFLINE'" class="btn-text !text-tiny" @click="handleRestore(row)">恢复</button>
          <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </BTable>

    <div class="mt-4 flex justify-center">
      <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
    </div>
  </div>
</template>
