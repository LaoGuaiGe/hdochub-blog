<script setup lang="ts">
const { toasts, dismiss } = useToast()

const tagMap: Record<string, string> = {
  success: 'OK',
  warning: '!',
  error: 'X',
  info: 'i'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed right-6 top-20 z-[100] flex flex-col gap-3" style="width: 380px; max-width: calc(100vw - 32px);">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-brutal cursor-pointer"
          :class="toast.type"
          @click="dismiss(toast.id)"
        >
          <div class="toast-brutal-tag">{{ tagMap[toast.type] }}</div>
          <div class="toast-brutal-body">{{ toast.message }}</div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.18s linear;
}
.toast-leave-active {
  transition: transform 0.15s cubic-bezier(0.6, 0, 0.8, 0.2), opacity 0.15s linear;
  position: absolute;
  width: 100%;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(120%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(120%);
}
.toast-move {
  transition: transform 0.18s ease;
}
</style>
