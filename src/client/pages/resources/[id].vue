<script setup lang="ts">
import { resourceApi } from '~/utils/api'
import { formatDate, formatNumber } from '~/utils/format'

const route = useRoute()
const { success, error: errorToast } = useToast()

const id = computed(() => Number(route.params.id))

const { data: resource, error } = await useAsyncData(
  () => `resource-${id.value}`,
  () => resourceApi.detail(id.value)
)

if (error.value || !resource.value) {
  throw createError({ statusCode: 404, statusMessage: '资源不存在', fatal: true })
}

// 下载信息（点击「获取下载链接」后才显示）
const downloadInfo = ref<{ downloadUrl: string; extractionCode: string | null; panType: string } | null>(null)
const fetching = ref(false)

async function fetchDownload() {
  fetching.value = true
  try {
    const info = await resourceApi.download(id.value)
    downloadInfo.value = info
    success('下载链接已生成')
  } catch (err: any) {
    errorToast(err.message || '获取下载链接失败')
  } finally {
    fetching.value = false
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    success('已复制到剪贴板')
  } catch {
    errorToast('复制失败，请手动选择复制')
  }
}

useHead(() => ({
  title: `${resource.value?.title} - 资源 - hdochub`
}))
</script>

<template>
  <div v-if="resource" class="container-list py-6">
    <!-- 面包屑 -->
    <nav class="mb-6 flex flex-wrap items-center gap-2 font-mono text-tiny">
      <NuxtLink to="/" class="border-2 border-transparent px-1 py-0.5 transition-all duration-fast ease-linear hover:border-black hover:bg-black hover:text-white">首页</NuxtLink>
      <span class="text-ink-500">&gt;</span>
      <NuxtLink to="/resources" class="border-2 border-transparent px-1 py-0.5 transition-all duration-fast ease-linear hover:border-black hover:bg-black hover:text-white">资源</NuxtLink>
      <span class="text-ink-500">&gt;</span>
      <span class="bg-yellow px-1 py-0.5 font-bold">{{ resource.title }}</span>
    </nav>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- 主内容 -->
      <div class="flex-1 min-w-0">
        <!-- 资源头部卡片 -->
        <div class="border-2 border-black bg-white">
          <!-- 封面 -->
          <div class="border-b-2 border-black aspect-[16/5] bg-ink-100 overflow-hidden">
            <img
              v-if="resource.coverImage"
              :src="resource.coverImage"
              :alt="resource.title"
              class="w-full h-full object-cover"
            >
            <div
              v-else
              class="w-full h-full flex items-center justify-center font-mono text-h2 font-bold text-ink-300 uppercase"
            >
              {{ resource.title.charAt(0) }}
            </div>
          </div>

          <!-- 标题区 -->
          <div class="border-b-2 border-black bg-yellow px-6 py-4">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span class="tag-solid">百度网盘</span>
              <span class="badge bg-white">下载 {{ formatNumber(resource.downloadCount) }} 次</span>
              <span class="badge bg-white">{{ formatDate(resource.createdAt) }}</span>
            </div>
            <h1 class="font-mono text-h1 font-bold leading-tight">{{ resource.title }}</h1>
          </div>

          <!-- 描述 -->
          <div v-if="resource.description" class="border-b-2 border-black px-6 py-4">
            <p class="font-mono text-small font-bold uppercase text-ink-500 mb-1">资源简介</p>
            <p class="font-sans text-body text-ink-900">{{ resource.description }}</p>
          </div>
        </div>

        <!-- 正文内容 -->
        <article v-if="resource.contentHtml" class="mt-6 border-2 border-black bg-white">
          <div class="flex items-center justify-between border-b-2 border-black bg-black px-4 py-2 text-white">
            <span class="font-mono text-small font-bold uppercase">详细介绍 DETAILS</span>
          </div>
          <div class="p-6 md:p-8">
            <div class="prose-brutal" v-html="resource.contentHtml"></div>
          </div>
        </article>

        <!-- 下载区 -->
        <div class="mt-6 border-2 border-black bg-white">
          <p class="border-b-2 border-black bg-pink px-4 py-2 font-mono text-small font-bold uppercase text-black">下载 DOWNLOAD</p>
          <div class="p-6">
            <div v-if="!downloadInfo" class="text-center">
              <p class="mb-4 font-mono text-small text-ink-700">点击下方按钮获取百度网盘下载链接与提取码</p>
              <BButton type="primary" size="large" :loading="fetching" @click="fetchDownload">
                <span class="font-mono font-bold uppercase">获取下载链接 →</span>
              </BButton>
            </div>

            <div v-else class="space-y-4">
              <!-- 下载地址 -->
              <div class="border-2 border-black p-3">
                <p class="font-mono text-tiny font-bold uppercase text-ink-500 mb-1">下载地址</p>
                <div class="flex items-center gap-2">
                  <a
                    :href="downloadInfo.downloadUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-mono text-small font-bold text-black underline break-all flex-1"
                  >
                    {{ downloadInfo.downloadUrl }}
                  </a>
                  <button class="btn-secondary !py-1 !px-2 !text-tiny" @click="copyText(downloadInfo.downloadUrl)">复制</button>
                </div>
              </div>

              <!-- 提取码 -->
              <div v-if="downloadInfo.extractionCode" class="border-2 border-black bg-yellow p-3">
                <p class="font-mono text-tiny font-bold uppercase text-black mb-1">提取码</p>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-h4 font-bold tracking-widest">{{ downloadInfo.extractionCode }}</span>
                  <button class="btn-primary !py-1 !px-2 !text-tiny" @click="copyText(downloadInfo.extractionCode)">复制</button>
                </div>
              </div>

              <!-- 直达按钮 -->
              <a
                :href="downloadInfo.downloadUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary block w-full text-center !py-3"
              >
                <span class="font-mono font-bold uppercase">前往百度网盘下载 →</span>
              </a>

              <p class="text-center font-mono text-tiny text-ink-500">
                无法下载？请检查链接是否失效或联系管理员
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧边栏 -->
      <aside class="hidden lg:block w-60 shrink-0">
        <div class="sticky top-20 space-y-4">
          <!-- 资源信息 -->
          <div class="border-2 border-black bg-white">
            <div class="border-b-2 border-black bg-black px-3 py-2">
              <span class="font-mono text-small font-bold uppercase text-white">资源信息</span>
            </div>
            <div class="p-3 space-y-2 font-mono text-tiny">
              <div class="flex justify-between">
                <span class="text-ink-500">网盘类型</span>
                <span class="font-bold">百度网盘</span>
              </div>
              <div class="flex justify-between">
                <span class="text-ink-500">下载次数</span>
                <span class="font-bold">{{ formatNumber(resource.downloadCount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-ink-500">发布时间</span>
                <span class="font-bold">{{ formatDate(resource.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 返回列表 -->
          <NuxtLink to="/resources" class="btn-secondary block w-full text-center">
            ← 返回资源列表
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>
