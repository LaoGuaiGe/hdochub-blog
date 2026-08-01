<script setup lang="ts">
interface Props {
  name: string
  slug?: string
  variant?: 'outline' | 'solid' | 'category'
  size?: 'default' | 'large'
  count?: number
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outline',
  size: 'default'
})

const emit = defineEmits<{
  close: []
  click: []
}>()

const classes = computed(() => {
  if (props.variant === 'solid') return 'tag-solid'
  if (props.variant === 'category') return 'tag-category'
  return 'tag'
})

const sizeClass = computed(() => {
  return props.size === 'large' ? 'px-3 py-1 text-small' : ''
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1"
    @click="emit('click')"
  >
    <span :class="[classes, sizeClass]">
      {{ name }}
      <span v-if="count !== undefined" class="ml-1 text-ink-500">({{ count }})</span>
    </span>
    <button
      v-if="closable"
      class="ml-1 font-mono text-tiny text-black hover:text-red"
      type="button"
      @click.stop="emit('close')"
    >
      ×
    </button>
  </span>
</template>
