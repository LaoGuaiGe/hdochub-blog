<script setup lang="ts">
interface Props {
  page: number
  totalPages: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [page: number]
}>()

/**
 * 生成页码数组，当前页前后各显示 2 页，超出用省略号
 */
const pages = computed<(number | string)[]>(() => {
  const total = props.totalPages
  const current = props.page
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const result: (number | string)[] = [1]
  if (current > 4) result.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  if (current < total - 3) result.push('...')
  result.push(total)
  return result
})

function goTo(p: number) {
  if (p < 1 || p > props.totalPages || p === props.page) return
  emit('change', p)
}
</script>

<template>
  <nav v-if="totalPages > 0" class="flex flex-wrap items-center gap-0" aria-label="分页">
    <button
      class="flex h-10 w-10 items-center justify-center border-2 border-black bg-white font-mono text-small font-bold transition-all duration-fast ease-linear hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-300 disabled:border-ink-200"
      :disabled="page <= 1"
      @click="goTo(page - 1)"
    >
      &lt;
    </button>
    <template v-for="(p, idx) in pages" :key="idx">
      <span v-if="p === '...'" class="flex h-10 w-10 items-center justify-center font-mono text-small">...</span>
      <button
        v-else
        class="flex h-10 w-10 items-center justify-center border-2 border-l-0 border-black font-mono text-small font-bold transition-all duration-fast ease-linear"
        :class="p === page ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'"
        :style="{ marginLeft: idx > 0 && pages[idx - 1] === '...' ? '-2px' : '0' }"
        @click="goTo(p as number)"
      >
        {{ p }}
      </button>
    </template>
    <button
      class="flex h-10 w-10 items-center justify-center border-2 border-l-0 border-black bg-white font-mono text-small font-bold transition-all duration-fast ease-linear hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-300 disabled:border-ink-200"
      :disabled="page >= totalPages"
      @click="goTo(page + 1)"
    >
      &gt;
    </button>
  </nav>
</template>
