<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  size?: 'default' | 'small'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索文章...',
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const keyword = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  keyword.value = val
})

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  keyword.value = val
  emit('update:modelValue', val)
}

function onSearch() {
  emit('search', keyword.value)
}

function onEnter() {
  onSearch()
}
</script>

<template>
  <div class="flex w-full items-stretch border-2 border-black bg-white shadow-px-2">
    <span class="flex items-center border-r-2 border-black px-3 font-mono text-small font-bold" :class="size === 'small' ? 'py-1' : 'py-2'">[Q]</span>
    <input
      :value="keyword"
      :placeholder="placeholder"
      class="min-w-0 flex-1 bg-white px-3 font-mono text-body-ui text-black placeholder:text-ink-500 focus:outline-none"
      :class="size === 'small' ? 'py-1 text-small' : 'py-2'"
      @input="onInput"
      @keyup.enter="onEnter"
    >
    <button
      type="button"
      class="border-l-2 border-black bg-black px-4 font-mono text-small font-bold text-white transition-all duration-fast ease-linear hover:bg-white hover:text-black"
      :class="size === 'small' ? 'py-1' : 'py-2'"
      @click="onSearch"
    >
      <slot name="action">搜索</slot>
    </button>
  </div>
</template>
