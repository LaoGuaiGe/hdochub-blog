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
// 后端不可用时不阻塞页面渲染
try {
  await initAuth()
} catch {
  // 忽略初始化错误，页面使用默认状态渲染
}
</script>
