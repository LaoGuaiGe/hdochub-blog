<script setup lang="ts">
import { formatNumber } from '~/utils/format'

interface Props {
  count: number
  liked: boolean
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: []
}>()

function onClick() {
  if (props.disabled) return
  emit('toggle')
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-mono text-small font-bold uppercase transition-all duration-fast ease-linear disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-300 disabled:border-ink-200"
    :class="liked ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'"
    @click="onClick"
  >
    <span>{{ liked ? '♥' : '♡' }}</span>
    <span>{{ formatNumber(count) }} 人点赞</span>
  </button>
</template>
