/**
 * 超级管理员校验中间件
 * 非超级管理员访问需要 SUPER_ADMIN 权限的页面（如站点设置）时重定向
 * BUG-015: 站点设置需要 SUPER_ADMIN 权限，普通 ADMIN 无法保存
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(useRoute().fullPath)}`)
  }
  if (!authStore.isSuperAdmin) {
    return navigateTo('/')
  }
})
