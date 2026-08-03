<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="fixed right-4 top-20 z-[100] flex flex-col gap-2" style="width: 320px; max-width: calc(100vw - 32px);">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="`alert-${toast.type}`"
          class="cursor-pointer flex items-center justify-between"
          @click="dismiss(toast.id)"
        >
          <span>{{ toast.message }}</span>
          <span class="ml-2">×</span>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.05s linear;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
