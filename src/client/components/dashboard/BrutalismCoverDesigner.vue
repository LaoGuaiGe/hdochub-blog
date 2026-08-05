<script setup lang="ts">
import type { CoverConfig } from '~/types'

interface Props {
  modelValue: string | null
  title: string
}
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const variants = [
  { id: '1', name: '黄底白字' },
  { id: '2', name: '斜线纹' },
  { id: '3', name: '黑底黄影' },
  { id: '4', name: '横纹卡' },
  { id: '5', name: '描边体' },
  { id: '6', name: '三层投影' }
]
const aligns: Array<{ id: CoverConfig['align']; name: string }> = [
  { id: 'left', name: '左对齐' },
  { id: 'center', name: '居中' },
  { id: 'right', name: '右对齐' }
]

const config = ref<CoverConfig>({
  variant: '1',
  fontSize: 36,
  align: 'left'
})

// 初始化：从已有 modelValue 解析
function syncFromModel() {
  if (props.modelValue) {
    try {
      const parsed = JSON.parse(props.modelValue) as CoverConfig
      config.value = {
        variant: parsed.variant || '1',
        fontSize: parsed.fontSize || 36,
        align: parsed.align || 'left'
      }
    } catch {
      /* ignore */
    }
  }
}
syncFromModel()

function emitChange() {
  emit('update:modelValue', JSON.stringify(config.value))
}

watch(config, emitChange, { deep: true })
</script>

<template>
  <div class="space-y-3">
    <!-- 实时预览 -->
    <BrutalismCover :config="JSON.stringify(config)" :title="title || '文章标题预览'" />

    <!-- 背景变体选择 -->
    <div>
      <label class="label">背景样式（固定野兽派）</label>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="v in variants"
          :key="v.id"
          type="button"
          class="border-2 border-black px-2 py-2 font-mono text-tiny font-bold transition-all duration-fast ease-linear"
          :class="config.variant === v.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-yellow'"
          @click="config.variant = v.id"
        >
          {{ v.name }}
        </button>
      </div>
    </div>

    <!-- 字号 -->
    <div>
      <label class="label">标题字号：<span class="text-red">{{ config.fontSize }}px</span></label>
      <input
        v-model.number="config.fontSize"
        type="range"
        min="20"
        max="72"
        step="2"
        class="w-full"
      >
    </div>

    <!-- 对齐 -->
    <div>
      <label class="label">对齐方式</label>
      <div class="flex gap-2">
        <button
          v-for="a in aligns"
          :key="a.id"
          type="button"
          class="flex-1 border-2 border-black px-2 py-2 font-mono text-tiny font-bold transition-all duration-fast ease-linear"
          :class="config.align === a.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-yellow'"
          @click="config.align = a.id"
        >
          {{ a.name }}
        </button>
      </div>
    </div>
  </div>
</template>
