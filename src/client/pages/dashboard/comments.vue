<script setup lang="ts">
import { commentApi } from '~/utils/api'
import { renderMarkdownHtml } from '~/utils/markdown'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const { success, error: errorToast } = useToast()

const page = ref(Number(route.query.page) || 1)

const { data, pending, refresh } = await useAsyncData(
  () => `my-comments-${page.value}`,
  () => commentApi.mine({ page: page.value, pageSize: 20 }),
  { watch: [page] }
)

const list = computed(() => data.value?.list || [])
const totalPages = computed(() => data.value?.pagination.totalPages || 0)

function changePage(p: number) {
  page.value = p
  router.replace({ query: { page: p !== 1 ? String(p) : undefined } })
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

const columns = [
  { key: 'articleTitle', title: '文章' },
  { key: 'authorName', title: '评论者' },
  { key: 'content', title: '内容' },
  { key: 'replyTo', title: '回复对象', hideOnTablet: true },
  { key: 'createdAt', title: '时间', hideOnMobile: true },
  { key: 'actions', title: '操作', align: 'right' as const }
]

useHead({ title: '我的评论 - hdochub' })
</script>

<template>
  <div>
    <div class="mb-6 border-b-2 border-black pb-3">
      <h1 class="font-mono text-h2 font-bold uppercase">我的评论</h1>
    </div>

    <BTable :columns="columns" :data="list" :loading="pending">
      <template #articleTitle="{ row }">
        <NuxtLink :to="`/post/${row.articleSlug}`" class="font-mono text-small border-b-2 border-transparent hover:border-black hover:bg-black hover:text-white px-1 transition-all duration-fast ease-linear truncate block max-w-[180px]">
          {{ row.articleTitle }}
        </NuxtLink>
      </template>
      <template #content="{ row }">
        <span class="font-mono text-tiny truncate block max-w-[200px]">{{ row.content }}</span>
      </template>
      <template #replyTo="{ row }">
        <span class="font-mono text-tiny">{{ row.replyTo?.name || '—' }}</span>
      </template>
      <template #createdAt="{ row }">
        <span class="font-mono text-tiny">{{ formatDate(row.createdAt) }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <NuxtLink :to="`/post/${row.articleSlug}`" class="btn-text !text-tiny">查看</NuxtLink>
          <button class="btn-text !text-tiny !text-red" @click="handleDelete(row)">删除</button>
        </div>
      </template>
    </BTable>

    <div class="mt-4 flex justify-center">
      <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
    </div>
  </div>
</template>
