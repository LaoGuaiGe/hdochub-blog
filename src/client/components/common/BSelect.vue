<script setup lang="ts">
import type { SelectOption } from '~/types'

interface Props {
  modelValue: string | number
  options: SelectOption[]
  label?: string
  required?: boolean
  help?: string
  error?: string
  disabled?: boolean
  placeholder?: string
  id?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const selectId = props.id || useId()

function onChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  const numVal = Number(val)
  const finalVal = isNaN(numVal) ? val : numVal
  emit('update:modelValue', finalVal)
  emit('change', finalVal)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="selectId" class="label" :class="{ 'label-required': required }">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        class="input appearance-none pr-10"
        :class="{ 'input-error': error }"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-small">▼</span>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="help" class="form-help">{{ help }}</p>
  </div>
</template>
