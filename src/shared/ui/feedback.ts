import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/notification/style/css'

type MessageMethod = 'success' | 'warning' | 'info' | 'error'

type NotificationOptions = Record<string, unknown>

let messageLoader: Promise<any> | null = null
let notificationLoader: Promise<any> | null = null

const loadMessage = async () => {
  messageLoader ??= import('element-plus/es/components/message/index').then((mod) => mod.ElMessage)
  return messageLoader
}

const loadNotification = async () => {
  notificationLoader ??= import('element-plus/es/components/notification/index').then((mod) => mod.ElNotification)
  return notificationLoader
}

const callMessage = (method: MessageMethod, messageText: string) => {
  void loadMessage().then((message) => {
    message({
      type: method,
      message: messageText,
      center: true,
      grouping: true,
      duration: 2200,
      customClass: `xbl-feedback-message xbl-feedback-message--${method}`,
    })
  })
}

export const message = {
  success(text: string) {
    callMessage('success', text)
  },
  warning(text: string) {
    callMessage('warning', text)
  },
  info(text: string) {
    callMessage('info', text)
  },
  error(text: string) {
    callMessage('error', text)
  }
}

export const notification = (options: NotificationOptions) => {
  void loadNotification().then((notify) => {
    notify(options)
  })
}
