<script setup lang="ts">
import type { ArticleListQuery } from '~/types'
import { articleApi, tagApi } from '~/utils/api'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

const page = ref(Number(route.query.page) || 1)
const sort = ref<'latest' | 'views'>((route.query.sort as 'latest' | 'views') || 'latest')

const query = computed<ArticleListQuery>(() => ({
  page: page.value,
  pageSize: 10,
  sort: sort.value,
  tag: slug.value,
  status: 'PUBLISHED'
}))

const { data: articles, pending } = await useAsyncData(
  () => `tag-articles-${slug.value}-${page.value}-${sort.value}`,
  () => articleApi.list(query.value),
  { watch: [page, sort] }
)

const { data: tag } = await useAsyncData(
  () => `tag-${slug.value}`,
  () => tagApi.list().then(list => list.find(t => t.slug === slug.value))
)

const list = computed(() => articles.value?.list || [])
const totalPages = computed(() => articles.value?.pagination.totalPages || 0)

function changePage(p: number) {
  page.value = p
  router.replace({ query: { page: p !== 1 ? String(p) : undefined, sort: sort.value !== 'latest' ? sort.value : undefined } })
}

function changeSort(s: 'latest' | 'views') {
  sort.value = s
  page.value = 1
}

useHead(() => ({ title: `标签: ${tag.value?.name || ''} - hdochub` }))
</script>

<template>
  <div class="container-list py-6">
    <div class="border-2 border-black bg-white p-6 mb-6 flex items-center justify-between">
      <h1 class="font-mono text-h2 font-bold uppercase">
        #{{ tag?.name || slug }}
      </h1>
      <div class="flex items-center gap-0">
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

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 6" :key="i" class="border-2 border-black p-4">
        <BLoading text="LOADING" />
      </div>
    </div>
    <div v-else-if="list.length === 0">
      <BEmpty title="NO RESULTS" description="该标签下暂无文章" />
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
