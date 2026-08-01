<script setup lang="ts">
interface Props {
  type?: 'success' | 'warning' | 'error' | 'info'
  message: string
}

withDefaults(defineProps<Props>(), {
  type: 'info'
})
</script>

<template>
  <div :class="`alert-${type}`">
    {{ message }}
  </div>
</template>
