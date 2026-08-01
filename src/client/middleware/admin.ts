/**
 * 管理员校验中间件
 * 非管理员访问 /admin 下的页面时重定向到首页
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.init()
  }
  if (!authStore.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (!authStore.isAdmin) {
    return navigateTo('/')
  }
})
