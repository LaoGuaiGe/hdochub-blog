<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: 400
})

const emit = defineEmits<{
  close: []
}>()

function onClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(0,0,0,0.7);"
      @click.self="onClose"
    >
      <div
        class="border-4 border-black bg-white"
        :style="{ width: width + 'px', maxWidth: '100%' }"
      >
        <div v-if="title" class="flex items-center justify-between bg-black px-4 py-2 text-white">
          <span class="font-mono text-small font-bold uppercase">{{ title }}</span>
          <button class="font-mono text-small text-white hover:text-yellow" @click="onClose">×</button>
        </div>
        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
