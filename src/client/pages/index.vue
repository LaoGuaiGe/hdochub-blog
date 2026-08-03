<script setup lang="ts">
import type { ArticleListItem, Category, Tag, Paginated, ArticleListQuery } from '~/types'
import { articleApi, categoryApi, tagApi } from '~/utils/api'

const siteStore = useSiteStore()

const route = useRoute()
const router = useRouter()

const page = ref(Number(route.query.page) || 1)
const sort = ref<'latest' | 'views'>((route.query.sort as 'latest' | 'views') || 'latest')
const categoryFilter = ref((route.query.category as string) || '')
const tagFilter = ref((route.query.tag as string) || '')

const query = computed<ArticleListQuery>(() => ({
  page: page.value,
  pageSize: 10,
  sort: sort.value,
  category: categoryFilter.value || undefined,
  tag: tagFilter.value || undefined,
  status: 'PUBLISHED'
}))

const { data, pending, refresh } = await useAsyncData(
  'home-articles',
  () => articleApi.list(query.value),
  { watch: [page, sort, categoryFilter, tagFilter] }
)

const { data: categories } = await useAsyncData('home-categories', () => categoryApi.list(), { default: () => [] })
const { data: tags } = await useAsyncData('home-tags', () => tagApi.list(), { default: () => [] })
const { data: hotArticles } = await useAsyncData('home-hot', () =>
  articleApi.list({ page: 1, pageSize: 5, sort: 'views', status: 'PUBLISHED' })
, { default: () => ({ list: [], pagination: { total: 0, page: 1, pageSize: 5, totalPages: 0 } }) })

const articles = computed(() => data.value?.list || [])
const total = computed(() => data.value?.pagination.total || 0)
const totalPages = computed(() => data.value?.pagination.totalPages || 0)

function changeSort(s: 'latest' | 'views') {
  sort.value = s
  page.value = 1
  updateQuery()
}

function changePage(p: number) {
  page.value = p
  updateQuery()
}

function updateQuery() {
  router.replace({
    query: {
      page: page.value !== 1 ? String(page.value) : undefined,
      sort: sort.value !== 'latest' ? sort.value : undefined,
      category: categoryFilter.value || undefined,
      tag: tagFilter.value || undefined
    }
  })
}

function selectCategory(slug: string) {
  categoryFilter.value = categoryFilter.value === slug ? '' : slug
  page.value = 1
  updateQuery()
}

function selectTag(slug: string) {
  tagFilter.value = tagFilter.value === slug ? '' : slug
  page.value = 1
  updateQuery()
}

useHead({
  title: 'hdochub 个人技术博客 - 首页',
  meta: [
    { name: 'description', content: '面向工程师的个人技术博客，记录工作生活中的技术问题、解决方案与观点。' }
  ]
})
</script>

<template>
  <div>
    <!-- Hero 标题区（像素字体，Neo-Brutalism 点缀） -->
    <div class="border-b-2 border-black bg-white">
      <div class="container-list py-8">
        <h1 class="font-pixel text-h2 font-bold uppercase text-black">{{ siteStore.title || 'hdochub' }}</h1>
        <p class="mt-4 font-mono text-body-ui text-ink-700">面向工程师的个人技术博客 · 记录问题、方案与观点</p>
      </div>
    </div>

    <!-- 排序工具栏 -->
    <div class="border-b-2 border-black bg-white">
      <div class="container-list py-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-0">
            <button
              class="border-2 border-black px-3 py-1 font-mono text-small font-bold uppercase transition-all duration-fast ease-linear"
              :class="sort === 'latest' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'"
              @click="changeSort('latest')"
            >
              时间倒序
            </button>
            <button
              class="border-2 border-l-0 border-black px-3 py-1 font-mono text-small font-bold uppercase transition-all duration-fast ease-linear"
              :class="sort === 'views' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'"
              @click="changeSort('views')"
            >
              阅读量
            </button>
          </div>
          <div class="flex items-center gap-2">
            <select
              v-if="categories && categories.length"
              v-model="categoryFilter"
              class="border-2 border-black bg-white px-2 py-1 font-mono text-tiny"
              @change="page = 1; updateQuery()"
            >
              <option value="">全部分类</option>
              <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }} ({{ c.articleCount }})</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容 + 侧边栏 -->
    <div class="container-list py-6">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- 文章列表 -->
        <div class="flex-1 min-w-0">
          <div v-if="pending" class="space-y-4">
            <div v-for="i in 6" :key="i" class="border-2 border-black p-4">
              <BLoading text="LOADING" />
            </div>
          </div>
          <div v-else-if="articles.length === 0">
            <BEmpty title="NO RESULTS" description="暂无文章">
              <NuxtLink to="/" class="btn-secondary">返回首页</NuxtLink>
            </BEmpty>
          </div>
          <div v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ArticleCard
                v-for="article in articles"
                :key="article.id"
                :article="article"
              />
            </div>
            <div class="mt-8 flex justify-center">
              <BPagination :page="page" :total-pages="totalPages" @change="changePage" />
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <aside class="w-full lg:w-60 lg:shrink-0 space-y-6">
          <!-- 搜索框 -->
          <div>
            <BSearchBar placeholder="搜索文章..." @search="(q) => navigateTo(`/search?q=${encodeURIComponent(q)}`)" />
          </div>

          <!-- 分类列表 -->
          <div v-if="categories && categories.length" class="border-2 border-black">
            <p class="border-b-2 border-black bg-cyan px-4 py-2 font-mono text-small font-bold uppercase text-black">
              分类 CATEGORIES
            </p>
            <ul>
              <li
                v-for="c in categories"
                :key="c.id"
                class="border-b-2 border-black last:border-b-0"
              >
                <NuxtLink
                  :to="`/category/${c.slug}`"
                  class="flex items-center justify-between px-4 py-2 font-mono text-small transition-all duration-fast ease-linear hover:bg-black hover:text-white"
                >
                  <span>{{ c.name }}</span>
                  <span class="text-tiny text-ink-500">({{ c.articleCount }})</span>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- 热门标签云 -->
          <div v-if="tags && tags.length" class="border-2 border-black">
            <p class="border-b-2 border-black bg-pink px-4 py-2 font-mono text-small font-bold uppercase text-black">
              标签 TAGS
            </p>
            <div class="p-4 flex flex-wrap gap-1">
              <NuxtLink
                v-for="t in tags.slice(0, 20)"
                :key="t.id"
                :to="`/tag/${t.slug}`"
                class="tag"
              >
                {{ t.name }}
              </NuxtLink>
            </div>
          </div>

          <!-- 热门文章 -->
          <div v-if="hotArticles && hotArticles.list.length" class="border-2 border-black">
            <p class="border-b-2 border-black bg-violet px-4 py-2 font-mono text-small font-bold uppercase text-black">
              热门 TOP5
            </p>
            <ol>
              <li
                v-for="(a, idx) in hotArticles.list"
                :key="a.id"
                class="border-b-2 border-black last:border-b-0"
              >
                <NuxtLink
                  :to="`/post/${a.slug}`"
                  class="flex items-start gap-2 px-4 py-2 transition-all duration-fast ease-linear hover:bg-black hover:text-white"
                >
                  <span class="font-mono text-small font-bold">{{ idx + 1 }}.</span>
                  <span class="font-mono text-tiny flex-1">{{ a.title }}</span>
                  <span class="font-mono text-tiny text-ink-500">{{ a.viewCount }}</span>
                </NuxtLink>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
