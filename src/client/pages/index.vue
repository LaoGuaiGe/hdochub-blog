<script setup lang="ts">
import type { ArticleListItem, Category, Tag, Paginated, ArticleListQuery } from '~/types'
import { articleApi, categoryApi, tagApi } from '~/utils/api'

const siteStore = useSiteStore()

// 品牌名拆分：英文部分用像素字体，中文部分用等宽字体（避免混排基线错位）
const brandName = computed(() => {
  const t = siteStore.title || 'hdochub 个人技术博客'
  const m = t.match(/[a-zA-Z0-9][a-zA-Z0-9-]*/)
  return m ? m[0] : 'hdochub'
})
const brandSuffix = computed(() => {
  const t = siteStore.title || 'hdochub 个人技术博客'
  const m = t.match(/[a-zA-Z0-9][a-zA-Z0-9-]*/)
  const rest = m ? t.slice(m[0].length).trim() : t
  return rest || siteStore.subtitle || ''
})

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
  <div class="neo-home">
    <section class="neo-hero"><div class="container-list neo-hero-grid"><div><span class="neo-eyebrow">独立书写 / 持续探索 / BUILD IN PUBLIC</span><h1 class="neo-title">把问题拆开。<br>把<span>想法写下。</span></h1><p class="neo-intro">这里是 {{ brandName }} 的技术自留地。<br>记录踩过的坑、跑通的方案，还有代码之外的思考。</p><div class="neo-actions"><a href="#articles" class="btn-primary">开始阅读 ↘</a><NuxtLink to="/about" class="neo-text-link">认识博主 ↗</NuxtLink></div></div><div class="neo-art" aria-hidden="true"><span class="neo-art-label">NOTES FROM THE DEV DESK</span><div class="neo-code"><span>01 / 思考进行中</span><strong>&lt;hello<br>&nbsp; world /&gt;</strong><p>遇到问题 → 找到答案 → 分享出来</p></div><span class="neo-sticker">保持好奇<br>KEEP CURIOUS ↗</span><span class="neo-star">✳</span></div></div></section><div class="neo-ticker"><span>CODE. WRITE. REPEAT.</span><span>技术 · 教程 · 观点 · 随笔</span><span>保持好奇，持续构建 ↗</span></div>
    <!-- 排序工具栏 -->
    <div id="articles" class="neo-toolbar border-b-2 border-black">
      <div class="container-list py-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-0"><h2 class="neo-section-title">最新笔记 <span>{{ total }} 篇</span></h2>
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
            <div class="neo-empty"><span class="neo-empty-index">NO. 001 / 下一篇，从这里开始</span><div class="neo-empty-symbol">[ _ ]</div><h3>好内容，正在酝酿。</h3><p>每一次解决问题，都值得留下记录。<br>第一篇笔记，留给下一个灵感。</p><NuxtLink to="/dashboard/editor" class="btn-primary">写下第一篇 ↗</NuxtLink></div>
          </div>
          <div v-else>
            <div class="editorial-feed">
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
        <aside class="w-full lg:w-72 lg:shrink-0 space-y-6">
<div class="neo-about"><span class="neo-eyebrow">HELLO, INTERNET!</span><h3>一个工程师的<br>开放笔记本。 ↗</h3><p>不止记录答案，也记录寻找答案的过程。</p><NuxtLink to="/about" class="neo-text-link">更多关于我 →</NuxtLink></div><!-- 搜索框 -->
          <div>
            <BSearchBar placeholder="搜索文章..." @search="(q) => navigateTo(`/search?q=${encodeURIComponent(q)}`)" />
          </div>

          <!-- 分类列表 -->
          <div v-if="categories && categories.length" class="neo-panel border-2 border-black">
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
          <div v-if="tags && tags.length" class="neo-panel border-2 border-black">
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
          <div v-if="hotArticles && hotArticles.list.length" class="neo-panel border-2 border-black">
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