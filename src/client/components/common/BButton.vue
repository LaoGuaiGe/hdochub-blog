<script setup lang="ts">
interface Props {
  type?: 'primary' | 'secondary' | 'danger' | 'text'
  size?: 'default' | 'small' | 'large'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  htmlType?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'default',
  htmlType: 'button'
})

const classes = computed(() => {
  const base = props.type === 'text' ? 'btn-text' : `btn-${props.type}`
  const sizeClass = props.size === 'small' ? 'px-2 py-1 text-tiny' : props.size === 'large' ? 'px-6 py-3 text-body-ui' : ''
  const blockClass = props.block ? 'w-full' : ''
  return [base, sizeClass, blockClass]
})
</script>

<template>
  <button
    :type="htmlType"
    :disabled="disabled || loading"
    :class="classes"
  >
    <span v-if="loading" class="loading-dots">SUBMITTING</span>
    <slot v-else />
  </button>
</template>
