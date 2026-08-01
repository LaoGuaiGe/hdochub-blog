<script setup lang="ts">
import { friendLinkApi } from '~/utils/api'
import { getInitial } from '~/utils/format'

const { data: links, pending } = await useAsyncData('friend-links', () => friendLinkApi.list())

useHead({ title: '友链 - hdochub' })
</script>

<template>
  <div class="container-list py-6">
    <div class="border-2 border-black bg-white p-6 mb-6">
      <h1 class="font-mono text-h2 font-bold uppercase">FRIENDS / 友情链接</h1>
    </div>

    <div v-if="pending" class="border-2 border-black bg-white p-6">
      <BLoading text="LOADING" full />
    </div>
    <div v-else-if="!links || links.length === 0">
      <BEmpty title="NO LINKS" description="暂无友链" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="card card-hover p-4 flex flex-col"
      >
        <div class="flex items-center gap-3 mb-3 border-b-2 border-black pb-3">
          <div v-if="link.logo" class="h-10 w-10 border-2 border-black overflow-hidden">
            <img :src="link.logo" :alt="link.name" class="h-full w-full object-cover">
          </div>
          <div v-else class="avatar" style="width: 40px; height: 40px;">
            {{ getInitial(link.name) }}
          </div>
          <h3 class="font-mono text-h5 font-bold">{{ link.name }}</h3>
        </div>
        <p class="font-sans text-small text-ink-700 flex-1 mb-3">{{ link.description || '暂无简介' }}</p>
        <span class="font-mono text-small font-bold uppercase border-t-2 border-black pt-2">
          访问 →
        </span>
      </a>
    </div>
  </div>
</template>
