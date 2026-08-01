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
  <div class="flex items-center gap-2">
    <button
      type="button"
      :disabled="disabled"
      class="relative h-6 w-12 border-2 border-black transition-all duration-fast ease-linear disabled:bg-ink-100 disabled:border-ink-200 disabled:cursor-not-allowed"
      :class="modelValue ? 'bg-black' : 'bg-white'"
      @click="toggle"
    >
      <span
        class="absolute top-0 h-[18px] w-[18px] border-2 border-black transition-all duration-fast ease-linear"
        :class="modelValue ? 'left-[24px] bg-yellow' : 'left-0 bg-white'"
      />
    </button>
    <span v-if="label" class="font-mono text-small">{{ label }}</span>
  </div>
</template>
