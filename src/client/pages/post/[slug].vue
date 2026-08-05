<script setup lang="ts">
import type { Article, Comment, ArticleListItem } from '~/types'
import { articleApi, commentApi } from '~/utils/api'
import { formatDate, formatNumber, countWords, readTime } from '~/utils/format'
import { renderMarkdown } from '~/utils/markdown'

const route = useRoute()
const { isLoggedIn, isAdmin, user } = useAuth()
const { success, error: errorToast } = useToast()

const slug = computed(() => route.params.slug as string)

const { data: article, error } = await useAsyncData(
  () => `article-${slug.value}`,
  () => articleApi.detail(slug.value)
)

if (error.value || !article.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在', fatal: true })
}

const { data: commentsData, refresh: refreshComments } = await useAsyncData(
  () => `article-comments-${slug.value}`,
  () => commentApi.list(slug.value)
)
const comments = computed(() => commentsData.value?.list || [])

const { data: related } = await useAsyncData(
  () => `article-related-${slug.value}`,
  () => articleApi.related(slug.value)
)

const { data: adjacent } = await useAsyncData(
  () => `article-adjacent-${slug.value}`,
  () => articleApi.adjacent(slug.value)
)

const prevArticle = computed(() => adjacent.value?.prev || null)
const nextArticle = computed(() => adjacent.value?.next || null)

const { html, toc } = computed(() => renderMarkdown(article.value!.content)).value

const wordCount = computed(() => countWords(article.value!.content))
const readMinutes = computed(() => readTime(wordCount.value))

const likeInfo = ref({
  liked: false,
  count: article.value?.likeCount || 0
})

async function toggleLike() {
  if (!isLoggedIn.value) {
    await navigateTo('/login')
    return
  }
  try {
    if (likeInfo.value.liked) {
      const res = await articleApi.unlike(article.value!.id)
      likeInfo.value.liked = res.liked
      likeInfo.value.count = res.likeCount
    } else {
      const res = await articleApi.like(article.value!.id)
      likeInfo.value.liked = res.liked
      likeInfo.value.count = res.likeCount
    }
  } catch (err: any) {
    errorToast(err.message || '操作失败')
  }
}

useHead(() => ({
  title: `${article.value?.title} - hdochub`,
  meta: [
    { name: 'description', content: article.value?.excerpt || '' }
  ]
}))
</script>

<template>
  <div v-if="article" class="container-list py-6">
    <!-- 面包屑 -->
    <nav class="mb-6 flex flex-wrap items-center gap-2 font-mono text-tiny">
      <NuxtLink to="/" class="border-2 border-transparent px-1 py-0.5 transition-all duration-fast ease-linear hover:border-black hover:bg-black hover:text-white">首页</NuxtLink>
      <span class="text-ink-500">&gt;</span>
      <NuxtLink :to="`/category/${article.category.slug}`" class="border-2 border-transparent px-1 py-0.5 transition-all duration-fast ease-linear hover:border-black hover:bg-black hover:text-white">{{ article.category.name }}</NuxtLink>
      <span class="text-ink-500">&gt;</span>
      <span class="bg-yellow px-1 py-0.5 font-bold">{{ article.title }}</span>
    </nav>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- 主内容 -->
      <div class="flex-1 min-w-0 lg:max-w-content">
        <!-- 文章头部卡片 -->
        <div class="border-2 border-black bg-white">
          <!-- 封面：野兽派设计 或 图片 -->
          <BrutalismCover
            v-if="article.coverConfig"
            :config="article.coverConfig"
            :title="article.title"
          />
          <img
            v-else-if="article.coverImage"
            :src="article.coverImage"
            :alt="article.title"
            class="w-full border-b-2 border-black object-cover"
            style="max-height: 420px;"
          >

          <!-- 标题区 -->
          <div class="border-b-2 border-black bg-yellow px-6 py-4">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <NuxtLink :to="`/category/${article.category.slug}`" class="tag-solid">
                {{ article.category.name }}
              </NuxtLink>
              <span class="badge bg-white">阅读 {{ formatNumber(article.viewCount) }}</span>
              <span class="badge bg-white">{{ wordCount }}字</span>
              <span class="badge bg-white">{{ readMinutes }}分钟</span>
            </div>
            <h1 class="font-mono text-h1 font-bold leading-tight">{{ article.title }}</h1>
          </div>

          <!-- 作者信息条 -->
          <div class="flex flex-wrap items-center gap-3 px-6 py-3">
            <BAvatar :src="article.author.avatar" :name="article.author.nickname || article.author.username" :size="36" />
            <div class="flex flex-col">
              <span class="font-mono text-small font-bold">{{ article.author.nickname || article.author.username }}</span>
              <span class="font-mono text-tiny text-ink-500">发布于 {{ formatDate(article.publishedAt) }}</span>
            </div>
            <div class="ml-auto flex flex-wrap gap-1">
              <NuxtLink
                v-for="tag in article.tags"
                :key="tag.id"
                :to="`/tag/${tag.slug}`"
                class="tag"
              >
                #{{ tag.name }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- 正文 -->
        <article class="mt-6 border-2 border-black bg-white">
          <div class="flex items-center justify-between border-b-2 border-black bg-black px-4 py-2 text-white">
            <span class="font-mono text-small font-bold uppercase">正文 CONTENT</span>
            <span class="font-mono text-tiny text-yellow">{{ article.wordCount }} WORDS</span>
          </div>
          <div class="p-6 md:p-8">
            <div class="prose-brutal" v-html="html"></div>
          </div>
        </article>

        <!-- 点赞区 -->
        <div class="mt-6 border-2 border-black bg-white">
          <p class="border-b-2 border-black bg-pink px-4 py-2 font-mono text-small font-bold uppercase text-black">点赞 LIKE</p>
          <div class="p-6 flex items-center justify-center">
            <LikeButton
              :count="likeInfo.count"
              :liked="likeInfo.liked"
              @toggle="toggleLike"
            />
          </div>
        </div>

        <!-- 评论区 -->
        <div class="mt-6 border-2 border-black bg-white">
          <CommentList
            :article-slug="slug"
            :comments="comments"
            :is-logged-in="isLoggedIn"
            :current-user-id="user?.id"
            :is-admin="isAdmin"
            @refresh="refreshComments"
          />
        </div>

        <!-- 上一篇/下一篇 -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NuxtLink
            v-if="prevArticle"
            :to="`/post/${prevArticle.slug}`"
            class="card card-hover p-4"
          >
            <p class="font-mono text-tiny text-ink-500">← 上一篇</p>
            <p class="mt-1 font-mono text-small font-bold">{{ prevArticle.title }}</p>
          </NuxtLink>
          <div v-else class="border-2 border-ink-200 p-4">
            <p class="font-mono text-tiny text-ink-300">已是第一篇</p>
          </div>
          <NuxtLink
            v-if="nextArticle"
            :to="`/post/${nextArticle.slug}`"
            class="card card-hover p-4 text-right"
          >
            <p class="font-mono text-tiny text-ink-500">下一篇 →</p>
            <p class="mt-1 font-mono text-small font-bold">{{ nextArticle.title }}</p>
          </NuxtLink>
          <div v-else class="border-2 border-ink-200 p-4 text-right">
            <p class="font-mono text-tiny text-ink-300">已是最后一篇</p>
          </div>
        </div>

        <!-- 相关文章 -->
        <div v-if="related && related.length" class="mt-6 border-2 border-black bg-white p-6">
          <p class="mb-4 font-mono text-h4 font-bold uppercase border-b-2 border-black pb-2">相关文章</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <NuxtLink
              v-for="r in related"
              :key="r.id"
              :to="`/post/${r.slug}`"
              class="font-mono text-small p-2 border-2 border-transparent hover:border-black hover:bg-yellow transition-all duration-fast ease-linear"
            >
              {{ r.title }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- TOC 侧边栏 -->
      <aside class="hidden lg:block w-52 shrink-0">
        <div class="sticky top-20">
          <ArticleToc :items="toc" />
        </div>
      </aside>
    </div>
  </div>
</template>
