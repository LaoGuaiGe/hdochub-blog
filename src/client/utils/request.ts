import type { ApiResponse } from '~/types'

const TOKEN_COOKIE = 'hdochub_token'

/**
 * 获取 token（兼容 SSR 与客户端）
 */
export function getToken(): string | null {
  const token = useCookie<string | null>(TOKEN_COOKIE)
  return token.value || null
}

/**
 * 设置/清除 token
 */
export function setToken(token: string | null, expires?: number) {
  const cookie = useCookie<string | null>(TOKEN_COOKIE, {
    sameSite: 'lax',
    // BUG-022: 生产环境（HTTPS）下 secure 应为 true，防止 cookie 通过 HTTP 明文传输
    secure: process.env.NODE_ENV === 'production',
    maxAge: expires,
    path: '/'
  })
  cookie.value = token
}

export function clearToken() {
  setToken(null)
}

/**
 * 统一请求封装
 */
export async function request<T = unknown>(
  url: string,
  options: any = {}
): Promise<T> {
  const config = useRuntimeConfig()
  let baseURL = config.public.apiBase

  // SSR 模式下，$fetch 不走 devProxy，需要使用绝对 URL 直接请求后端
  if (import.meta.server) {
    baseURL = process.env.NUXT_PUBLIC_API_BASE_SSR || 'http://localhost:4000/api'
  }

  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers || {})
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  // BUG-023: 写操作（POST/PUT/DELETE/PATCH）携带 CSRF 防护头
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers['X-Requested-With'] = 'XMLHttpRequest'
  }

  try {
    const response = await $fetch<ApiResponse<T>>(url, {
      baseURL,
      ...options,
      headers
    })

    if (response.code !== 0) {
      throw new Error(response.message || '请求失败')
    }
    return response.data
  } catch (err: any) {
    // $fetch 错误处理
    const data = err?.data
    if (data && typeof data === 'object' && 'code' in data) {
      const apiError = data as ApiResponse
      // token 失效
      if (apiError.code === 401) {
        clearToken()
        const authStore = useAuthStore()
        authStore.clearAuth()
        if (import.meta.client) {
          const route = useRoute()
          if (!route.path.startsWith('/login')) {
            navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
          }
        }
      }
      throw new Error(apiError.message || '请求失败')
    }
    if (err?.message) {
      throw new Error(err.message)
    }
    throw new Error('网络异常，请稍后重试')
  }
}

/**
 * GET 请求
 */
export function get<T = unknown>(url: string, params?: Record<string, any>) {
  return request<T>(url, { method: 'GET', query: params })
}

/**
 * POST 请求
 */
export function post<T = unknown>(url: string, body?: any) {
  return request<T>(url, { method: 'POST', body })
}

/**
 * PUT 请求
 */
export function put<T = unknown>(url: string, body?: any) {
  return request<T>(url, { method: 'PUT', body })
}

/**
 * DELETE 请求
 */
export function del<T = unknown>(url: string, body?: any) {
  return request<T>(url, { method: 'DELETE', body })
}

/**
 * 用于 useFetch/useAsyncData 的 key 生成
 */
export function buildUrl(url: string, params?: Record<string, any>): string {
  if (!params) return url
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return query ? `${url}?${query}` : url
}
