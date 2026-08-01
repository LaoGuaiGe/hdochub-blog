/**
 * 登录校验中间件
 * 未登录用户访问 /dashboard 下的页面时重定向到登录页
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.init()
  }
  if (!authStore.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
