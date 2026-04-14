import { reactive } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

type Resolver = (value: boolean) => void

export const confirmState = reactive({
  visible: false,
  title: '温馨提示',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
})

let activeResolver: Resolver | null = null

export const confirm = (options: ConfirmOptions): Promise<boolean> => {
  if (activeResolver) {
    activeResolver(false)
    activeResolver = null
  }

  confirmState.visible = true
  confirmState.title = options.title || '温馨提示'
  confirmState.message = options.message
  confirmState.confirmText = options.confirmText || '确定'
  confirmState.cancelText = options.cancelText || '取消'

  return new Promise<boolean>((resolve) => {
    activeResolver = resolve
  })
}

export const resolveConfirm = (value: boolean) => {
  confirmState.visible = false
  const resolver = activeResolver
  activeResolver = null
  resolver?.(value)
}
