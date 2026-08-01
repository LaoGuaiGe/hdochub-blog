<template>
  <div class="flex min-h-screen flex-col bg-white">
    <TheHeader />
    <main class="flex-1">
      <slot />
    </main>
    <TheFooter />
    <BToastContainer />
    <BConfirmDialog />
  </div>
</template>

<script setup lang="ts">
const { initAuth } = useAuth()
await initAuth()
</script>
