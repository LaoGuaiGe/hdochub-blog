<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  label?: string
  required?: boolean
  help?: string
  error?: string
  disabled?: boolean
  rows?: number
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const textareaId = props.id || `textarea-${Math.random().toString(36).slice(2, 9)}`

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="textareaId" class="label" :class="{ 'label-required': required }">
      {{ label }}
    </label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      class="input resize-y"
      :class="{ 'input-error': error }"
      style="min-height: 120px;"
      @input="onInput"
      @blur="emit('blur')"
    />
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="help" class="form-help">{{ help }}</p>
  </div>
</template>
