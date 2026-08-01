<script setup lang="ts">
import type { Category } from '~/types'
import { categoryApi } from '~/utils/api'

const { data: categories } = await useAsyncData('categories-all', () => categoryApi.list())

useHead({ title: '分类 - hdochub' })
</script>

<template>
  <div class="container-list py-6">
    <div class="border-2 border-black bg-white p-6 mb-6">
      <h1 class="font-mono text-h2 font-bold uppercase">CATEGORIES / 分类</h1>
    </div>

    <div v-if="!categories || categories.length === 0">
      <BEmpty title="NO CATEGORIES" description="暂无分类" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="c in categories"
        :key="c.id"
        :to="`/category/${c.slug}`"
        class="card card-hover p-6"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-mono text-h3 font-bold">{{ c.name }}</h3>
          <span class="font-mono text-h4 font-bold">{{ c.articleCount }}</span>
        </div>
        <p class="font-sans text-small text-ink-700">{{ c.description || '暂无描述' }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
