<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2 font-mono text-small">
    <span
      class="flex h-5 w-5 items-center justify-center border-2 border-black transition-all duration-fast ease-linear"
      :class="modelValue ? 'bg-black' : 'bg-white'"
      @click="toggle"
    >
      <span v-if="modelValue" class="text-yellow text-tiny font-bold">✓</span>
    </span>
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="sr-only"
      @change="toggle"
    >
    <span v-if="label">{{ label }}</span>
  </label>
</template>
