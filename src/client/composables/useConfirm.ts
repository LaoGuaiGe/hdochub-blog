/**
 * 确认弹窗组合式函数（用于二次确认删除等操作）
 */
interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState {
  visible: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

const confirmState = reactive<ConfirmState>({
  visible: false,
  options: { message: '' },
  resolve: null
})

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirmState.options = {
        title: '确认操作',
        confirmText: '确认',
        cancelText: '取消',
        danger: false,
        ...options
      }
      confirmState.resolve = resolve
      confirmState.visible = true
    })
  }

  function handleConfirm() {
    confirmState.visible = false
    confirmState.resolve?.(true)
    confirmState.resolve = null
  }

  function handleCancel() {
    confirmState.visible = false
    confirmState.resolve?.(false)
    confirmState.resolve = null
  }

  return {
    confirmState,
    confirm,
    handleConfirm,
    handleCancel
  }
}
