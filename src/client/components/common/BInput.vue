<script setup lang="ts">
interface Props {
  modelValue: string | number
  type?: string
  placeholder?: string
  label?: string
  required?: boolean
  help?: string
  error?: string
  disabled?: boolean
  id?: string
  autocomplete?: string
  size?: 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  focus: []
  enter: []
}>()

const inputId = props.id || `input-${Math.random().toString(36).slice(2, 9)}`

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onBlur() {
  emit('blur')
}

function onFocus() {
  emit('focus')
}

function onEnter() {
  emit('enter')
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="label" :class="{ 'label-required': required }">
      {{ label }}
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete"
      class="input"
      :class="{ 'input-error': error, 'py-4 text-h4': size === 'large' }"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
      @keyup.enter="onEnter"
    >
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="help" class="form-help">{{ help }}</p>
  </div>
</template>
