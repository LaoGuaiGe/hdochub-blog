<script setup lang="ts">
import type { ArticleListQuery } from '~/types'
import { articleApi, categoryApi, tagApi } from '~/utils/api'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

const page = ref(Number(route.query.page) || 1)
const sort = ref<'latest' | 'views'>((route.query.sort as 'latest' | 'views') || 'latest')
const tagFilter = ref((route.query.tag as string) || '')

const query = computed<ArticleListQuery>(() => ({
  page: page.value,
  pageSize: 10,
  sort: sort.value,
  category: slug.value,
  tag: tagFilter.value || undefined,
  status: 'PUBLISHED'
}))

const { data: articles, pending } = await useAsyncData(
  () => `category-articles-${slug.value}-${page.value}-${sort.value}-${tagFilter.value}`,
  () => articleApi.list(query.value),
  { watch: [page, sort, tagFilter] }
)

const { data: category } = await useAsyncData(
  () => `category-${slug.value}`,
  () => categoryApi.list().then(list => list.find(c => c.slug === slug.value))
)

const { data: tags } = await useAsyncData('category-tags', () => tagApi.list())

const list = computed(() => articles.value?.list || [])
const totalPages = computed(() => articles.value?.pagination.totalPages || 0)

function changePage(p: number) {
  page.value = p
  router.replace({ query: { page: p !== 1 ? String(p) : undefined, sort: sort.value !== 'latest' ? sort.value : undefined, tag: tagFilter.value || undefined } })
}

function changeSort(s: 'latest' | 'views') {
  sort.value = s
  page.value = 1
}

useHead(() => ({ title: `${category.value?.name || '分类'} - hdochub` }))
</script>

<template>
  <div class="container-list py-6">
    <!-- 分类标题 -->
    <div class="border-2 border-black bg-white p-6 mb-6">
      <h1 class="font-mono text-h2 font-bold uppercase">{{ category?.name || '分类' }}</h1>
      <p v-if="category?.description" class="mt-2 font-sans text-small text-ink-700">{{ category.description }}</p>
    </div>

    <!-- 筛选区 -->
    <div class="border-2 border-black bg-white p-3 mb-6 flex flex-wrap items-center gap-2">
      <span class="font-mono text-small font-bold">筛选标签:</span>
      <button
        class="border-2 border-black px-2 py-0.5 font-mono text-tiny font-bold transition-all duration-fast ease-linear"
        :class="!tagFilter ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'"
        @click="tagFilter = ''; page = 1"
      >
        全部
      </button>
      <button
        v-for="t in tags"
        :key="t.id"
        class="border-2 border-black px-2 py-0.5 font-mono text-tiny font-bold transition-all duration-fast ease-linear"
        :class="tagFilter === t.slug ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'"
        @click="tagFilter = t.slug; page = 1"
      >
        {{ t.name }}
      </button>
      <div class="ml-auto flex items-center gap-0">
        <button
          class="border-2 border-black px-3 py-1 font-mono text-small font-bold uppercase transition-all duration-fast ease-linear"
          :class="sort === 'latest' ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'"
          @click="changeSort('latest')"
        >
          时间
        </button>
        <button
          class="border-2 border-l-0 border-black px-3 py-1 font-mono text-small font-bold uppercase transition-all duration-fast ease-linear"
          :class="sort === 'views' ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'"
          @click="changeSort('views')"
        >
          阅读量
        </button>
      </div>
    </div>

    <!-- 文章列表 -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 6" :key="i" class="border-2 border-black p-4">
        <BLoading text="LOADING" />
      </div>
    </div>
    <div v-else-if="list.length === 0">
      <BEmpty title="NO RESULTS" description="该分类下暂无文章" />
    </div>
    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArticleCard v-for="article in list" :key="article.id" :article="article" />
      </div>
      <div class="mt-8 flex justify-center">
        <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
      </div>
    </div>
  </div>
</template>
