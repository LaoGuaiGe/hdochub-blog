<script setup lang="ts">
import type { CommentStatus } from '~/types'
import { commentApi } from '~/utils/api'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const page = ref(Number(route.query.page) || 1)
const statusFilter = ref<'ALL' | CommentStatus>((route.query.status as any) || 'ALL')

const query = computed(() => ({
  page: page.value,
  pageSize: 20,
  status: statusFilter.value === 'ALL' ? undefined : statusFilter.value
}))

const { data, pending, refresh } = await useAsyncData(
  () => `admin-comments-${page.value}-${statusFilter.value}`,
  () => commentApi.all(query.value),
  { watch: [page, statusFilter] }
)

const list = computed(() => data.value?.list || [])
const totalPages = computed(() => data.value?.pagination.totalPages || 0)

const pendingCount = ref(0)

const statusTabs = [
  { label: '全部', value: 'ALL' },
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已删除', value: 'DELETED' }
]

function changeTab(tab: 'ALL' | CommentStatus) {
  statusFilter.value = tab
  page.value = 1
}

function changePage(p: number) {
  page.value = p
}

async function handleApprove(comment: any) {
  try {
    await commentApi.approve(comment.id)
    success('评论已通过')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

async function handleDelete(comment: any) {
  const ok = await confirm({
    title: '删除评论',
    message: '确认删除该评论？',
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await commentApi.delete(comment.id)
    success('评论已删除')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '删除失败')
  }
}

async function handleBanUser(comment: any) {
  const ok = await confirm({
    title: '屏蔽评论者',
    message: `确认屏蔽用户「${comment.authorName}」？屏蔽后该用户无法登录和发言。`,
    confirmText: '屏蔽',
    danger: true
  })
  if (!ok) return
  try {
    await commentApi.banUser(comment.authorId)
    success('用户已屏蔽')
    refresh()
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

const columns = [
  { key: 'articleTitle', title: '文章' },
  { key: 'authorName', title: '评论者' },
  { key: 'content', title: '内容' },
  { key: 'replyTo', title: '回复对象', hideOnTablet: true },
  { key: 'createdAt', title: '时间', hideOnMobile: true },
  { key: 'status', title: '状态' },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '评论管理 - hdochub admin' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">评论管理</h1>
    </div>

    <!-- 状态筛选 -->
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
        <span v-if="tab.value === 'PENDING' && pendingCount > 0" class="ml-1 bg-yellow px-1 text-black">{{ pendingCount }}</span>
      </button>
    </div>

    <BTable :columns="columns" :data="list" :loading="pending">
      <template #articleTitle="{ row }">
        <NuxtLink :to="`/post/${row.articleSlug}`" class="font-mono text-tiny border-b-2 border-transparent hover:border-black hover:bg-black hover:text-white px-1 transition-all duration-fast ease-linear truncate block max-w-[140px]">
          {{ row.articleTitle }}
        </NuxtLink>
      </template>
      <template #content="{ row }">
        <span class="font-mono text-tiny truncate block max-w-[180px]">{{ row.content }}</span>
      </template>
      <template #replyTo="{ row }">
        <span class="font-mono text-tiny">{{ row.replyTo?.name || '—' }}</span>
      </template>
      <template #createdAt="{ row }">
        <span class="font-mono text-tiny">{{ formatDate(row.createdAt) }}</span>
      </template>
      <template #status="{ row }">
        <BBadge :status="row.status" />
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <button v-if="row.status === 'PENDING'" class="btn-text !text-tiny" @click="handleApprove(row)">通过</button>
          <NuxtLink :to="`/post/${row.articleSlug}`" class="btn-text !text-tiny">查看</NuxtLink>
          <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
          <button class="btn-text !text-tiny !text-red" @click="handleBanUser(row)">屏蔽者</button>
        </div>
      </template>
    </BTable>

    <div class="mt-4 flex justify-center">
      <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
    </div>
  </div>
</template>
