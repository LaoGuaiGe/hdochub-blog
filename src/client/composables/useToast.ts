/**
 * 全局提示 Toast 组合式函数
 */
interface ToastItem {
  id: number
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
}

const toasts = ref<ToastItem[]>([])
let toastId = 0

export function useToast() {
  function show(type: ToastItem['type'], message: string, duration = 3000) {
    const id = ++toastId
    toasts.value.push({ id, type, message })
    if (import.meta.client) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }

  function success(message: string) {
    show('success', message)
  }

  function warning(message: string) {
    show('warning', message)
  }

  function error(message: string) {
    show('error', message)
  }

  function info(message: string) {
    show('info', message)
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx > -1) {
      toasts.value.splice(idx, 1)
    }
  }

  return {
    toasts,
    show,
    success,
    warning,
    error,
    info,
    dismiss
  }
}
