<template>
  <div class="flex min-h-screen flex-col bg-white">
    <header class="sticky top-0 z-50 flex h-14 items-center justify-between border-b-2 border-black bg-black px-4 text-white">
      <div class="flex items-center gap-4">
        <NuxtLink to="/" class="font-mono text-small font-bold uppercase hover:text-yellow transition-all duration-fast ease-linear">
          ← 返回前台
        </NuxtLink>
        <span class="hidden sm:inline font-mono text-tiny text-ink-300">|</span>
        <span class="hidden sm:inline font-mono text-tiny text-ink-300">用户后台 DASHBOARD</span>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/dashboard/editor" class="btn-primary !py-1 !px-3 !text-tiny">写文章</NuxtLink>
        <button class="btn-secondary !py-1 !px-3 !text-tiny" @click="handleLogout">退出</button>
      </div>
    </header>

    <div class="flex flex-1">
      <TheSidebar type="dashboard" />
      <main class="flex-1 p-4 md:p-6">
        <slot />
      </main>
    </div>

    <BToastContainer />
    <BConfirmDialog />
  </div>
</template>

<script setup lang="ts">
const { initAuth, logout } = useAuth()
await initAuth()

async function handleLogout() {
  await logout()
}
</script>
