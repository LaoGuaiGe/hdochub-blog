<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown'

// BUG-020: 后端无 /pages/about 接口，关于页面内容直接硬编码在前端
const aboutContent = `# 关于本站

hdochub 个人技术博客，记录工程生涯中的技术问题、解决方案与观点。

## 联系方式

- 邮箱：blog@hdochub.com
- GitHub：github.com/hdochub`

const html = computed(() => renderMarkdown(aboutContent).html)

useHead({ title: '关于 - hdochub' })
</script>

<template>
  <div class="container-list py-6">
    <div class="mx-auto max-w-content">
      <div class="border-2 border-black bg-white p-6 md:p-8">
        <article class="prose-brutal" v-html="html" />
      </div>
    </div>
  </div>
</template>
