<script setup lang="ts">
import type { ArticleListItem } from '~/types'
import { searchApi } from '~/utils/api'
import { formatDate } from '~/utils/format'

const route = useRoute()
const router = useRouter()

const keyword = ref((route.query.q as string) || '')
const page = ref(Number(route.query.page) || 1)

const { data, pending } = await useAsyncData(
  () => `search-${keyword.value}-${page.value}`,
  () => searchApi.articles(keyword.value, { page: page.value, pageSize: 10 }),
  { watch: [keyword, page] }
)

const results = computed(() => data.value?.list || [])
const total = computed(() => data.value?.pagination.total || 0)
const totalPages = computed(() => data.value?.pagination.totalPages || 0)

function onSearch(q: string) {
  keyword.value = q
  page.value = 1
  router.replace({ query: { q: keyword.value, page: undefined } })
}

function changePage(p: number) {
  page.value = p
  router.replace({ query: { q: keyword.value, page: p !== 1 ? String(p) : undefined } })
  if (import.meta.client) window.scrollTo({ top: 0 })
}

useHead(() => ({
  title: `搜索: ${keyword.value} - hdochub`
}))
</script>

<template>
  <div class="container-list py-6">
    <!-- 搜索框区 -->
    <div class="border-2 border-black bg-white p-4 mb-6">
      <BSearchBar
        :model-value="keyword"
        placeholder="搜索文章标题与正文..."
        @search="onSearch"
      />
      <div class="mt-3 flex items-center justify-between font-mono text-tiny text-ink-700">
        <span>当前关键词："<span class="bg-yellow px-1">{{ keyword }}</span>"</span>
        <span>找到 {{ total }} 条结果</span>
      </div>
    </div>

    <!-- 结果列表 -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="border-2 border-black p-4">
        <BLoading text="LOADING" />
      </div>
    </div>
    <div v-else-if="results.length === 0">
      <BEmpty title="NO RESULTS" description="未找到相关文章">
        <div class="flex gap-2 justify-center">
          <NuxtLink to="/" class="btn-secondary">返回首页</NuxtLink>
          <NuxtLink to="/category" class="btn-primary">浏览分类</NuxtLink>
        </div>
      </BEmpty>
    </div>
    <div v-else class="space-y-4">
      <NuxtLink
        v-for="article in results"
        :key="article.id"
        :to="`/post/${article.slug}`"
        class="card card-hover block p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-mono text-tiny text-ink-500">命中结果</span>
          <span class="font-mono text-tiny">{{ formatDate(article.publishedAt) }}</span>
        </div>
        <!-- 标题/摘要直接使用后端已转义并高亮的 HTML -->
        <h3 class="font-mono text-h5 font-bold mb-2" v-html="article.title" />
        <p v-if="article.summary" class="font-sans text-small text-ink-700 mb-2 line-clamp-2" v-html="article.summary" />
      </NuxtLink>

      <div class="flex justify-center pt-4">
        <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
/* 搜索关键词高亮（后端 <em> 标记） */
:deep(.card em) {
  background: var(--color-yellow);
  color: var(--color-black);
  font-style: normal;
  padding: 0 2px;
}
</style>
