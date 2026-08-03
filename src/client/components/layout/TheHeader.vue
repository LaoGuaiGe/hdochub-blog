<script setup lang="ts">
const route = useRoute()
const { isLoggedIn, isAdmin, displayName, avatar, logout } = useAuth()
const siteStore = useSiteStore()

// 品牌名英文部分（像素字体），避免与中文混排基线错位
const brandName = computed(() => {
  const t = siteStore.title || 'hdochub 个人技术博客'
  const m = t.match(/[a-zA-Z0-9][a-zA-Z0-9-]*/)
  return m ? m[0] : 'hdochub'
})

const mobileMenuOpen = ref(false)
const searchKeyword = ref('')
const userMenuOpen = ref(false)

const navItems = [
  { label: '首页', path: '/' },
  { label: '分类', path: '/category' },
  { label: '标签', path: '/tag' },
  { label: '归档', path: '/archive' },
  { label: '关于', path: '/about' },
  { label: '友链', path: '/links' }
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function onSearch() {
  if (!searchKeyword.value.trim()) return
  navigateTo(`/search?q=${encodeURIComponent(searchKeyword.value.trim())}`)
  mobileMenuOpen.value = false
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

async function handleLogout() {
  closeUserMenu()
  await logout()
}
</script>

<template>
  <header class="sticky top-0 z-[100] border-b-4 border-black bg-white">
    <div class="container-list flex h-16 items-center justify-between gap-4">
      <!-- 左侧：站点标题 -->
      <div class="flex items-center gap-6">
        <NuxtLink to="/" class="font-pixel text-h5 font-bold uppercase tracking-wide border-2 border-transparent px-2 py-1 hover:bg-black hover:text-white transition-all duration-fast ease-linear">
          {{ brandName }}
        </NuxtLink>
        <!-- 桌面端导航 -->
        <nav class="hidden md:flex items-center gap-0">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="border-t-2 border-transparent px-3 py-1 font-mono text-body-ui transition-all duration-fast ease-linear"
            :class="isActive(item.path) ? 'border-black font-bold' : 'hover:bg-black hover:text-white'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- 右侧：搜索 + 用户 -->
      <div class="flex items-center gap-3">
        <div class="hidden lg:block w-56">
          <BSearchBar
            v-model="searchKeyword"
            size="small"
            placeholder="搜索..."
            @search="onSearch"
          />
        </div>

        <!-- 未登录 -->
        <template v-if="!isLoggedIn">
          <NuxtLink to="/login" class="btn-secondary hidden sm:inline-flex">登录</NuxtLink>
          <NuxtLink to="/register" class="btn-primary hidden sm:inline-flex">注册</NuxtLink>
        </template>

        <!-- 已登录 -->
        <div v-else class="relative ml-2">
          <button
            class="flex items-center gap-2 border-2 border-black bg-white px-3 py-1 transition-all duration-fast ease-linear hover:bg-black hover:text-white"
            @click="toggleUserMenu"
          >
            <BAvatar :src="avatar" :name="displayName" :size="28" />
            <span class="hidden sm:inline font-mono text-small font-bold">{{ displayName }}</span>
            <span class="font-mono text-tiny">▼</span>
          </button>
          <div
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-0 w-44 border-2 border-t-0 border-black bg-white"
            @click="closeUserMenu"
          >
            <NuxtLink to="/dashboard" class="block border-b-2 border-black px-4 py-2 font-mono text-small font-bold hover:bg-black hover:text-white transition-all duration-fast ease-linear">
              用户后台
            </NuxtLink>
            <NuxtLink to="/dashboard/editor" class="block border-b-2 border-black px-4 py-2 font-mono text-small font-bold hover:bg-black hover:text-white transition-all duration-fast ease-linear">
              写文章
            </NuxtLink>
            <NuxtLink v-if="isAdmin" to="/admin" class="block border-b-2 border-black px-4 py-2 font-mono text-small font-bold hover:bg-black hover:text-white transition-all duration-fast ease-linear">
              管理后台
            </NuxtLink>
            <button class="block w-full px-4 py-2 text-left font-mono text-small font-bold text-red hover:bg-red hover:text-white transition-all duration-fast ease-linear" @click="handleLogout">
              退出
            </button>
          </div>
        </div>

        <!-- 移动端汉堡菜单 -->
        <button
          class="md:hidden border-2 border-black bg-white px-3 py-1 font-mono text-h5 transition-all duration-fast ease-linear hover:bg-black hover:text-white"
          @click="toggleMobileMenu"
        >
          ≡
        </button>
      </div>
    </div>

    <!-- 移动端展开菜单 -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t-2 border-black bg-black text-white">
      <nav class="flex flex-col">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="border-b-2 border-white px-6 py-3 font-mono text-body-ui font-bold transition-all duration-fast ease-linear hover:bg-white hover:text-black"
          :class="isActive(item.path) ? 'bg-yellow text-black' : ''"
          @click="mobileMenuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
        <div class="p-4">
          <BSearchBar
            v-model="searchKeyword"
            placeholder="搜索文章..."
            @search="onSearch"
          />
        </div>
        <div v-if="!isLoggedIn" class="flex gap-2 p-4">
          <NuxtLink to="/login" class="btn-secondary flex-1 justify-center" @click="mobileMenuOpen = false">登录</NuxtLink>
          <NuxtLink to="/register" class="btn-primary flex-1 justify-center" @click="mobileMenuOpen = false">注册</NuxtLink>
        </div>
      </nav>
    </div>
  </header>
</template>
