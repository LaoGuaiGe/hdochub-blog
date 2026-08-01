<script setup lang="ts">
import type { ArticleStatus, ArticleListItem } from '~/types'
import { articleApi } from '~/utils/api'
import { formatDate, formatNumber } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const page = ref(Number(route.query.page) || 1)
const statusFilter = ref<'ALL' | ArticleStatus>((route.query.status as any) || 'ALL')

const query = computed(() => ({
  page: page.value,
  pageSize: 20,
  status: statusFilter.value === 'ALL' ? undefined : statusFilter.value
}))

const { data, pending, refresh } = await useAsyncData(
  () => `my-articles-${page.value}-${statusFilter.value}`,
  () => articleApi.mine(query.value),
  { watch: [page, statusFilter] }
)

const list = computed(() => data.value?.list || [])
const totalPages = computed(() => data.value?.pagination.totalPages || 0)

const selectedKeys = ref<(string | number)[]>([])

const statusTabs = [
  { label: '全部', value: 'ALL' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已下架', value: 'OFFLINE' }
]

function changeTab(tab: 'ALL' | ArticleStatus) {
  statusFilter.value = tab
  page.value = 1
  router.replace({ query: { status: tab !== 'ALL' ? tab : undefined, page: undefined } })
}

function changePage(p: number) {
  page.value = p
  router.replace({ query: { status: statusFilter.value !== 'ALL' ? statusFilter.value : undefined, page: p !== 1 ? String(p) : undefined } })
}

async function handleDelete(article: ArticleListItem) {
  const ok = await confirm({
    title: '删除文章',
    message: `确认删除文章「${article.title}」？删除后不可恢复。`,
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

async function handleToggleStatus(article: ArticleListItem) {
  try {
    if (article.status === 'PUBLISHED') {
      // 已发布 -> 转草稿（使用专门的 unpublish 接口，仅传必要状态）
      await articleApi.unpublish(article.id)
      success('已转为草稿')
    } else if (article.status === 'DRAFT') {
      // 草稿 -> 发布（使用专门的 publish 接口）
      await articleApi.publish(article.id)
      success('已发布')
    } else {
      // OFFLINE 等其他状态不能直接通过此按钮发布，需在编辑页操作
      errorToast('当前状态不支持直接发布，请编辑文章后发布')
      return
    }
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

const columns = [
  { key: 'title', title: '标题' },
  { key: 'categoryName', title: '分类', hideOnMobile: true },
  { key: 'status', title: '状态' },
  { key: 'viewCount', title: '阅读', hideOnMobile: true },
  { key: 'likeCount', title: '点赞', hideOnMobile: true },
  { key: 'publishedAt', title: '时间', hideOnTablet: true },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '我的文章 - hdochub' })
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">文章管理 / 我的文章</h1>
      <NuxtLink to="/dashboard/editor" class="btn-primary">+ 写文章</NuxtLink>
    </div>

    <!-- 状态筛选 Tab -->
    <div class="mb-4 flex items-center gap-0">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="border-2 border-black px-4 py-1 font-mono text-small font-bold uppercase transition-all duration-fast ease-linear"
        :class="[
          statusFilter === tab.value ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white',
          tab.value !== 'ALL' ? 'border-l-0' : ''
        ]"
        @click="changeTab(tab.value as any)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 表格 -->
    <BTable
      :columns="columns"
      :data="list"
      :loading="pending"
    >
      <template #title="{ row }">
        <NuxtLink :to="`/post/${row.slug}`" class="font-mono text-small border-b-2 border-transparent hover:border-black hover:bg-black hover:text-white px-1 transition-all duration-fast ease-linear truncate block max-w-[200px]">
          {{ row.title }}
        </NuxtLink>
      </template>
      <template #status="{ row }">
        <BBadge :status="row.status" />
      </template>
      <template #viewCount="{ row }">
        {{ formatNumber(row.viewCount) }}
      </template>
      <template #likeCount="{ row }">
        {{ formatNumber(row.likeCount) }}
      </template>
      <template #publishedAt="{ row }">
        {{ formatDate(row.publishedAt || row.createdAt) }}
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <NuxtLink :to="`/dashboard/editor?slug=${row.slug}`" class="btn-text !text-tiny">编辑</NuxtLink>
          <button
            v-if="row.status === 'PUBLISHED'"
            class="btn-text !text-tiny"
            @click="handleToggleStatus(row)"
          >
            转草稿
          </button>
          <button
            v-else-if="row.status === 'DRAFT'"
            class="btn-text !text-tiny"
            @click="handleToggleStatus(row)"
          >
            发布
          </button>
          <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </BTable>

    <div class="mt-4 flex justify-center">
      <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
    </div>
  </div>
</template>
