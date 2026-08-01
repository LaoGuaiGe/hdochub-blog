/**
 * 认证相关组合式函数
 */
export function useAuth() {
  const authStore = useAuthStore()
  const siteStore = useSiteStore()

  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const isAdmin = computed(() => authStore.isAdmin)
  const user = computed(() => authStore.user)
  const displayName = computed(() => authStore.displayName)
  const avatar = computed(() => authStore.avatar)

  /**
   * 初始化认证状态（SSR 与客户端均执行）
   */
  async function initAuth() {
    await Promise.all([
      authStore.init(),
      siteStore.load()
    ])
  }

  /**
   * 登录
   */
  async function login(token: string, user: any, remember?: boolean) {
    await authStore.login(token, user, remember)
  }

  /**
   * 退出登录
   */
  async function logout() {
    await authStore.logout()
    await navigateTo('/')
  }

  return {
    isLoggedIn,
    isAdmin,
    user,
    displayName,
    avatar,
    initAuth,
    login,
    logout
  }
}
