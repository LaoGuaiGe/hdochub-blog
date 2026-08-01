<script setup lang="ts">
import { renderMarkdownHtml } from '~/utils/markdown'

interface Props {
  modelValue: string
  placeholder?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入 Markdown 内容...',
  height: 400
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const content = ref(props.modelValue)
const mode = ref<'split' | 'edit' | 'preview'>('split')
const isFullscreen = ref(false)

watch(() => props.modelValue, (val) => {
  if (val !== content.value) {
    content.value = val
  }
})

watch(content, (val) => {
  emit('update:modelValue', val)
})

const previewHtml = computed(() => renderMarkdownHtml(content.value))

const toolbar = [
  { icon: 'B', action: 'bold', title: '加粗' },
  { icon: 'I', action: 'italic', title: '斜体' },
  { icon: 'H1', action: 'h1', title: '标题1' },
  { icon: 'H2', action: 'h2', title: '标题2' },
  { icon: 'H3', action: 'h3', title: '标题3' },
  { icon: 'UL', action: 'ul', title: '无序列表' },
  { icon: 'OL', action: 'ol', title: '有序列表' },
  { icon: '<>', action: 'code', title: '代码块' },
  { icon: '""', action: 'quote', title: '引用' },
  { icon: 'LNK', action: 'link', title: '链接' },
  { icon: 'IMG', action: 'image', title: '图片' },
  { icon: 'TBL', action: 'table', title: '表格' }
]

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function insertText(before: string, after = '', placeholder = '') {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = content.value.substring(start, end) || placeholder
  const newText = content.value.substring(0, start) + before + selected + after + content.value.substring(end)
  content.value = newText
  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(start + before.length, start + before.length + selected.length)
  })
}

function handleToolbar(action: string) {
  switch (action) {
    case 'bold':
      insertText('**', '**', '加粗文字')
      break
    case 'italic':
      insertText('*', '*', '斜体文字')
      break
    case 'h1':
      insertText('# ', '', '标题1')
      break
    case 'h2':
      insertText('## ', '', '标题2')
      break
    case 'h3':
      insertText('### ', '', '标题3')
      break
    case 'ul':
      insertText('- ', '', '列表项')
      break
    case 'ol':
      insertText('1. ', '', '列表项')
      break
    case 'code':
      insertText('\n```bash\n', '\n```\n', '代码')
      break
    case 'quote':
      insertText('> ', '', '引用')
      break
    case 'link':
      insertText('[', '](https://)', '链接文字')
      break
    case 'image':
      insertText('![', '](https://)', '图片描述')
      break
    case 'table':
      insertText('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n')
      break
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

const editorClass = computed(() => {
  return isFullscreen.value
    ? 'fixed inset-0 z-50 bg-white p-4'
    : ''
})
</script>

<template>
  <div :class="editorClass" class="border-2 border-black bg-white">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between border-b-2 border-black bg-ink-100 px-2 py-1">
      <div class="flex items-center gap-0 flex-wrap">
        <button
          v-for="tool in toolbar"
          :key="tool.action"
          type="button"
          :title="tool.title"
          class="border-r-2 border-black px-3 py-1 font-mono text-small font-bold transition-all duration-fast ease-linear last:border-r-0 hover:bg-black hover:text-white"
          @click="handleToolbar(tool.action)"
        >
          {{ tool.icon }}
        </button>
      </div>
      <div class="flex items-center gap-0">
        <button
          type="button"
          class="border-l-2 border-black px-3 py-1 font-mono text-tiny font-bold uppercase transition-all duration-fast ease-linear hover:bg-black hover:text-white"
          :class="mode === 'edit' ? 'bg-black text-white' : ''"
          @click="mode = 'edit'"
        >
          编辑
        </button>
        <button
          type="button"
          class="border-l-2 border-black px-3 py-1 font-mono text-tiny font-bold uppercase transition-all duration-fast ease-linear hover:bg-black hover:text-white"
          :class="mode === 'split' ? 'bg-black text-white' : ''"
          @click="mode = 'split'"
        >
          分屏
        </button>
        <button
          type="button"
          class="border-l-2 border-black px-3 py-1 font-mono text-tiny font-bold uppercase transition-all duration-fast ease-linear hover:bg-black hover:text-white"
          :class="mode === 'preview' ? 'bg-black text-white' : ''"
          @click="mode = 'preview'"
        >
          预览
        </button>
        <button
          type="button"
          class="border-l-2 border-black px-3 py-1 font-mono text-tiny font-bold uppercase transition-all duration-fast ease-linear hover:bg-black hover:text-white"
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>
    </div>

    <!-- 编辑区 + 预览区 -->
    <div class="flex" :style="{ height: height + 'px' }">
      <div
        v-show="mode !== 'preview'"
        class="border-r-2 border-black"
        :class="mode === 'split' ? 'w-1/2' : 'w-full'"
      >
        <textarea
          ref="textareaRef"
          v-model="content"
          :placeholder="placeholder"
          class="h-full w-full resize-none border-0 bg-white p-4 font-mono text-small text-black placeholder:text-ink-500 focus:outline-none"
        />
      </div>
      <div
        v-show="mode !== 'edit'"
        :class="mode === 'split' ? 'w-1/2' : 'w-full'"
        class="overflow-auto bg-white p-4"
      >
        <div v-if="content" class="prose-brutal" v-html="previewHtml" />
        <p v-else class="font-mono text-small text-ink-500">预览区域 PREVIEW</p>
      </div>
    </div>
  </div>
</template>
