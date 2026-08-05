<script setup lang="ts">
import { resourceApi } from '~/utils/api'
import { formatDate, formatNumber } from '~/utils/format'

const { data: resources, pending } = await useAsyncData('resources-list', () => resourceApi.list())

useHead({ title: '资源 - hdochub' })
</script>

<template>
  <div class="container-list py-6">
    <!-- 标题区 -->
    <div class="border-2 border-black bg-white mb-6">
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <h1 class="font-mono text-h2 font-bold uppercase">RESOURCES / 资源</h1>
          <p class="mt-1 font-mono text-tiny text-ink-500">百度网盘资源分享，点击查看详情获取下载链接</p>
        </div>
        <span class="border-2 border-black bg-yellow px-3 py-1 font-mono text-tiny font-bold uppercase">
          百度网盘 BAIDU PAN
        </span>
      </div>
    </div>

    <div v-if="pending" class="border-2 border-black bg-white p-6">
      <BLoading text="LOADING" full />
    </div>
    <div v-else-if="!resources || resources.length === 0">
      <BEmpty title="NO RESOURCES" description="暂无资源" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="r in resources"
        :key="r.id"
        :to="`/resources/${r.id}`"
        class="card card-hover flex flex-col"
      >
        <!-- 封面 -->
        <div class="border-b-2 border-black aspect-video bg-ink-100 overflow-hidden relative">
          <img
            v-if="r.coverImage"
            :src="r.coverImage"
            :alt="r.title"
            class="w-full h-full object-cover"
          >
          <div
            v-else
            class="w-full h-full flex items-center justify-center font-mono text-h4 font-bold text-ink-300 uppercase"
          >
            {{ r.title.charAt(0) }}
          </div>
          <span class="absolute left-0 top-0 bg-black px-2 py-1 font-mono text-tiny font-bold uppercase text-yellow">
            百度云
          </span>
        </div>

        <!-- 内容 -->
        <div class="p-4 flex flex-col flex-1">
          <h3 class="font-mono text-h5 font-bold mb-2 line-clamp-1">{{ r.title }}</h3>
          <p class="font-sans text-small text-ink-700 flex-1 mb-3 line-clamp-2">
            {{ r.description || '暂无介绍' }}
          </p>
          <div class="flex items-center justify-between border-t-2 border-black pt-2">
            <span class="font-mono text-tiny text-ink-500">{{ formatDate(r.createdAt) }}</span>
            <span class="font-mono text-tiny font-bold uppercase">
              下载 {{ formatNumber(r.downloadCount) }} ↓
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
