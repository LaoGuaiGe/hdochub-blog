<script setup lang="ts">
import { tagApi } from '~/utils/api'

const { data: tags } = await useAsyncData('tags-all', () => tagApi.list())

const maxSize = computed(() => {
  if (!tags.value || tags.value.length === 0) return 1
  return Math.max(...tags.value.map(t => t.articleCount || 0), 1)
})

function fontSize(count: number): string {
  const ratio = count / maxSize.value
  const size = 0.75 + ratio * 0.75
  return `${size}rem`
}

useHead({ title: '标签 - hdochub' })
</script>

<template>
  <div class="container-list py-6">
    <div class="border-2 border-black bg-white p-6 mb-6">
      <h1 class="font-mono text-h2 font-bold uppercase">TAGS / 标签</h1>
    </div>

    <div v-if="!tags || tags.length === 0">
      <BEmpty title="NO TAGS" description="暂无标签" />
    </div>
    <div v-else class="border-2 border-black bg-white p-6">
      <div class="flex flex-wrap gap-2 items-center">
        <NuxtLink
          v-for="t in tags"
          :key="t.id"
          :to="`/tag/${t.slug}`"
          class="border-2 border-black px-2 py-0.5 font-mono font-bold transition-all duration-fast ease-linear hover:bg-black hover:text-white"
          :style="{ fontSize: fontSize(t.articleCount || 0) }"
        >
          {{ t.name }} <span class="text-ink-500">({{ t.articleCount }})</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
