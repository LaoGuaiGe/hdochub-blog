<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-white p-4">
    <div class="border-4 border-black bg-white p-8 max-w-md w-full text-center">
      <div class="bg-black text-white px-4 py-2 font-mono font-bold text-h2 -m-8 mb-6 border-b-2 border-black">
        ERROR {{ error.statusCode }}
      </div>
      <p class="font-mono text-body-ui mb-6">
        {{ error.statusCode === 404 ? '页面不存在 NO RESULTS' : '系统错误 SYSTEM ERROR' }}
      </p>
      <p class="font-mono text-small text-ink-700 mb-6">
        {{ error.message || '发生了未知错误' }}
      </p>
      <button class="btn-primary w-full" @click="handleError">
        返回首页 / HOME
      </button>
    </div>
  </div>
</template>
