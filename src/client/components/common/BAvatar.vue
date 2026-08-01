<script setup lang="ts">
import { getInitial } from '~/utils/format'

interface Props {
  src?: string | null
  name?: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 40
})

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.floor(props.size * 0.4)}px`
}))
</script>

<template>
  <div class="avatar" :style="sizeStyle">
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="h-full w-full object-cover"
    >
    <span v-else>{{ getInitial(name || '?') }}</span>
  </div>
</template>
