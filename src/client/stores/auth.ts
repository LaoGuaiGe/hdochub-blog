import { defineStore } from 'pinia'
import type { User } from '~/types'
import { authApi } from '~/utils/api'
import { getToken, setToken, clearToken } from '~/utils/request'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as User | null,
    initialized: false as boolean
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    isSuperAdmin: (state) => state.user?.role === 'SUPER_ADMIN',
    // 管理员（含超级管理员）可访问后台管理页面
    isAdmin: (state) => state.user?.role === 'ADMIN' || state.user?.role === 'SUPER_ADMIN',
    isUser: (state) => state.user?.role === 'USER' || state.user?.role === 'ADMIN' || state.user?.role === 'SUPER_ADMIN',
    displayName: (state) => state.user?.nickname || state.user?.username || '',
    avatar: (state) => state.user?.avatar || null
  },

  actions: {
    /**
     * 初始化：从 cookie 读取 token，并请求用户信息
     */
    async init() {
      if (this.initialized) return
      const token = getToken()
      if (token) {
        this.token = token
        try {
          const user = await authApi.me()
          this.user = user
        } catch {
          this.clearAuth()
        }
      }
      this.initialized = true
    },

    /**
     * 登录成功后设置 token 与用户
     */
    async login(token: string, user: User, remember?: boolean) {
      const expires = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7
      setToken(token, expires)
      this.token = token
      this.user = user
      this.initialized = true
    },

    /**
     * 刷新用户信息
     */
    async refreshUser() {
      if (!this.token) return
      try {
        const user = await authApi.me()
        this.user = user
      } catch {
        this.clearAuth()
      }
    },

    /**
     * 清除认证状态
     */
    clearAuth() {
      clearToken()
      this.token = null
      this.user = null
    },

    /**
     * 退出登录
     */
    async logout() {
      try {
        await authApi.logout()
      } catch {
        // 忽略错误
      }
      this.clearAuth()
    }
  }
})
