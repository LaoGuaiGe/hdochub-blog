<script setup lang="ts">
import type { ArticlePayload } from '~/types'
import { renderMarkdown } from '~/utils/markdown'
import { countWords, readTime } from '~/utils/format'

definePageMeta({ layout: 'default' })

const form = ref<ArticlePayload | null>(null)

onMounted(() => {
  const raw = sessionStorage.getItem('preview-article')
  if (raw) {
    form.value = JSON.parse(raw)
  }
})

const { html, toc } = computed(() => {
  if (!form.value) return { html: '', toc: [] }
  return renderMarkdown(form.value.content)
}).value

const wordCount = computed(() => form.value ? countWords(form.value.content) : 0)
</script>

<template>
  <div class="container-list py-6">
    <div v-if="!form" class="border-2 border-black bg-white p-12">
      <BEmpty title="NO CONTENT" description="没有预览内容" />
    </div>
    <div v-else>
      <div class="border-2 border-black bg-white p-6 mb-6">
        <h1 class="font-mono text-h1 font-bold">{{ form.title }}</h1>
        <p class="mt-2 font-mono text-tiny text-ink-500">{{ wordCount }}字 · 阅读{{ readTime(wordCount) }}分钟</p>
      </div>
      <article class="border-2 border-black bg-white p-6 max-w-content mx-auto">
        <MarkdownRenderer :content="form.content" />
      </article>
    </div>
  </div>
</template>
