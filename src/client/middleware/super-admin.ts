/**
 * 超级管理员校验中间件
 * 非超级管理员访问需要 SUPER_ADMIN 权限的页面（如站点设置）时重定向
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.init()
  }
  if (!authStore.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (!authStore.isSuperAdmin) {
    return navigateTo('/')
  }
})
