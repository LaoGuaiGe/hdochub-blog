<script setup lang="ts">
interface Props {
  text?: string
  full?: boolean
}

withDefaults(defineProps<Props>(), {
  text: 'LOADING',
  full: false
})
</script>

<template>
  <div v-if="full" class="flex min-h-[200px] w-full items-center justify-center">
    <span class="loading-block loading-dots font-mono text-small font-bold uppercase">{{ text }}</span>
  </div>
  <span v-else class="loading-block loading-dots font-mono text-small font-bold uppercase">{{ text }}</span>
</template>
