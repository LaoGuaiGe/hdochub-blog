<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown'

interface Props {
  content: string
}

const props = defineProps<Props>()

const { html, toc } = computed(() => renderMarkdown(props.content)).value

// 暴露 toc 给父组件
defineExpose({ toc })

// 客户端：复制代码功能
onMounted(() => {
  document.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const wrapper = target.closest('.code-block-wrapper')
      if (!wrapper) return
      const code = wrapper.querySelector('code')
      if (!code) return
      const text = code.textContent || ''
      navigator.clipboard.writeText(text).then(() => {
        target.textContent = '已复制'
        setTimeout(() => {
          target.textContent = '复制'
        }, 2000)
      })
    })
  })
})
</script>

<template>
  <div class="prose-brutal" v-html="html" />
</template>

<style>
.code-block-wrapper {
  margin-bottom: 1rem;
}
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #000000;
  color: #FFFF00;
  padding: 4px 12px;
  border-bottom: 2px solid #000;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.code-copy-btn {
  background: transparent;
  color: #FFFF00;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  text-transform: uppercase;
  transition: all 0.05s linear;
}
.code-copy-btn:hover {
  color: #FFFFFF;
}
.code-block-wrapper pre {
  margin: 0;
  border: none;
}
</style>
