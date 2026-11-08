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
  <NuxtLink :to="`/post/${article.slug}`" class="editorial-card">
    <div class="editorial-card-meta"><span class="editorial-category">{{ article.category?.name || article.categoryName || '笔记' }}</span><span>{{ formatDate(article.publishedAt) }}</span><span class="editorial-arrow" aria-hidden="true">↗</span></div>
    <div class="editorial-card-body">
      <div class="editorial-card-copy"><h3>{{ article.title }}</h3><p>{{ truncate(article.summary || article.excerpt || '', 160) }}</p><div v-if="article.tags?.length" class="editorial-tags"><span v-for="tag in article.tags.slice(0, 3)" :key="tag.id"># {{ tag.name }}</span></div></div>
      <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" class="editorial-cover" loading="lazy">
    </div>
    <div class="editorial-card-footer"><span class="editorial-author"><BAvatar :src="article.author?.avatar || article.authorAvatar" :name="article.author?.nickname || article.author?.username || article.authorName" :size="22" />{{ article.author?.nickname || article.author?.username || article.authorName }}</span><span class="editorial-metrics">{{ formatNumber(article.viewCount) }} 次阅读 <span>·</span> {{ formatNumber(article.commentCount) }} 条讨论</span><span class="editorial-read">阅读全文 →</span></div>
  </NuxtLink>
</template>