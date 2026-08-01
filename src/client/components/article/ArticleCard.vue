<script setup lang="ts">
import type { ArticleListItem } from '~/types'
import { formatNumber, formatDate, truncate } from '~/utils/format'

interface Props {
  article: ArticleListItem
  highlightKeyword?: string
}

const props = defineProps<Props>()
</script>

<template>
  <NuxtLink :to="`/post/${article.slug}`" class="card card-hover block">
    <!-- 封面图 -->
    <div v-if="article.coverImage" class="border-b-2 border-black">
      <img
        :src="article.coverImage"
        :alt="article.title"
        class="w-full object-cover"
        style="aspect-ratio: 16/9;"
        loading="lazy"
      >
    </div>

    <!-- 分类 + 阅读量 -->
    <div class="flex items-center justify-between border-b-2 border-black px-4 py-2">
      <span class="tag-category">{{ article.categoryName }}</span>
      <span class="font-mono text-tiny">阅读 {{ formatNumber(article.viewCount) }}</span>
    </div>

    <!-- 标题 -->
    <div class="border-b-2 border-black px-4 py-3">
      <h3 class="font-mono text-h5 font-bold leading-tight">
        {{ article.title }}
      </h3>
    </div>

    <!-- 摘要 -->
    <div class="border-b-2 border-black px-4 py-3">
      <p class="font-sans text-small text-ink-700 overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
        {{ truncate(article.excerpt, 100) }}
      </p>
    </div>

    <!-- 标签 -->
    <div v-if="article.tags && article.tags.length" class="border-b-2 border-black px-4 py-2 flex flex-wrap gap-1">
      <span v-for="tag in article.tags" :key="tag.id" class="tag">
        #{{ tag.name }}
      </span>
    </div>

    <!-- 元信息 -->
    <div class="flex items-center justify-between px-4 py-2">
      <div class="flex items-center gap-2">
        <BAvatar :src="article.authorAvatar" :name="article.authorName" :size="24" />
        <span class="font-mono text-tiny">{{ article.authorName }}</span>
        <span class="font-mono text-tiny text-ink-500">·</span>
        <span class="font-mono text-tiny text-ink-500">{{ formatDate(article.publishedAt) }}</span>
      </div>
      <div class="flex items-center gap-3 font-mono text-tiny">
        <span>♡ {{ formatNumber(article.likeCount) }}</span>
        <span>[C] {{ formatNumber(article.commentCount) }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
