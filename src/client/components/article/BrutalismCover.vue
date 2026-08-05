<script setup lang="ts">
import type { CoverConfig } from '~/types'

interface Props {
  config: string | null
  title: string
  rounded?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  rounded: false
})

const parsed = computed<CoverConfig | null>(() => {
  if (!props.config) return null
  try {
    return JSON.parse(props.config) as CoverConfig
  } catch {
    return null
  }
})
</script>

<template>
  <div
    v-if="parsed"
    class="brutal-cover"
    :class="[`bc-variant-${parsed.variant || 1}`, `bc-align-${parsed.align || 'left'}`]"
  >
    <div class="brutal-cover-inner">
      <span
        class="brutal-cover-title"
        :style="{ fontSize: (parsed.fontSize || 36) + 'px' }"
      >{{ title }}</span>
    </div>
  </div>
</template>
