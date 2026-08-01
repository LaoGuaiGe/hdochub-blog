<script setup lang="ts">
interface Props {
  type?: 'dashboard' | 'admin'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'dashboard'
})

const route = useRoute()
const { isLoggedIn, displayName, avatar, logout } = useAuth()

const dashboardMenus = [
  { label: '概览', path: '/dashboard', icon: '[#]' },
  { label: '文章管理', path: '/dashboard/posts', icon: '[=]' },
  { label: '写文章', path: '/dashboard/editor', icon: '[+]' },
  { label: '我的评论', path: '/dashboard/comments', icon: '[>]' },
  { label: '个人资料', path: '/dashboard/profile', icon: '[@]' }
]

const adminMenus = [
  { label: '概览', path: '/admin', icon: '[#]' },
  { label: '文章管理', path: '/admin/posts', icon: '[=]' },
  { label: '分类管理', path: '/admin/categories', icon: '[C]' },
  { label: '标签管理', path: '/admin/tags', icon: '[T]' },
  { label: '评论管理', path: '/admin/comments', icon: '[>]' },
  { label: '用户管理', path: '/admin/users', icon: '[U]' },
  { label: '站点设置', path: '/admin/settings', icon: '[S]' }
]

const menus = computed(() => props.type === 'admin' ? adminMenus : dashboardMenus)

const mobileOpen = ref(false)

function isActive(path: string): boolean {
  if (path === '/dashboard' || path === '/admin') return route.path === path
  return route.path.startsWith(path)
}

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

async function handleLogout() {
  await logout()
}
</script>

<template>
  <aside class="w-full md:w-60 md:shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-black bg-white md:min-h-[calc(100vh-56px)]">
    <!-- 移动端切换按钮 -->
    <button
      class="md:hidden w-full border-b-2 border-black bg-black px-4 py-2 text-left font-mono text-small font-bold text-white"
      @click="toggleMobile"
    >
      {{ mobileOpen ? '收起菜单 ▲' : '展开菜单 ▼' }}
    </button>

    <div :class="{ 'hidden md:block': !mobileOpen }">
      <!-- 用户信息 -->
      <div v-if="isLoggedIn" class="border-b-2 border-black p-4 flex items-center gap-3">
        <BAvatar :src="avatar" :name="displayName" :size="32" />
        <div class="min-w-0">
          <p class="font-mono text-small font-bold truncate">{{ displayName }}</p>
          <NuxtLink to="/" class="font-mono text-tiny text-ink-500 hover:text-black transition-all duration-fast ease-linear">返回前台 →</NuxtLink>
        </div>
      </div>

      <!-- 菜单 -->
      <nav>
        <NuxtLink
          v-for="menu in menus"
          :key="menu.path"
          :to="menu.path"
          class="flex items-center gap-3 border-b-2 border-black px-4 py-3 font-mono text-body-ui transition-all duration-fast ease-linear"
          :class="isActive(menu.path) ? 'bg-yellow text-black font-bold border-l-4 border-l-black' : 'hover:bg-black hover:text-white'"
          @click="mobileOpen = false"
        >
          <span class="w-6 text-center font-bold">{{ menu.icon }}</span>
          <span>{{ menu.label }}</span>
        </NuxtLink>
      </nav>

      <!-- 退出 -->
      <button
        class="w-full border-b-2 border-black px-4 py-3 text-left font-mono text-body-ui text-red transition-all duration-fast ease-linear hover:bg-red hover:text-white"
        @click="handleLogout"
      >
        退出登录
      </button>
    </div>
  </aside>
</template>
