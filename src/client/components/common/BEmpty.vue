<script setup lang="ts">
interface Props {
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  title: 'NO RESULTS',
  description: '暂无数据'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center border-2 border-black bg-white p-12 text-center">
    <p class="font-mono text-h3 font-bold uppercase tracking-wide">{{ title }}</p>
    <p class="mt-2 font-mono text-small text-ink-700">{{ description }}</p>
    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </div>
</template>
