/**
 * 管理员校验中间件
 * 非管理员访问 /admin 下的页面时重定向到首页
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(useRoute().fullPath)}`)
  }
  if (!authStore.isAdmin) {
    return navigateTo('/')
  }
})
