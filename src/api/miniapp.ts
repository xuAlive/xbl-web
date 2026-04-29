import { $get, $post } from "../utils/request"
import { message } from '@/shared/ui/feedback'

/**
 * 小程序接口
 */
export interface Miniapp {
  id: number
  name: string
  intro: string
  icon: string
  color: string
  category: string
  tagType: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  route?: string
  externalLink?: string
  sortOrder: number
  isDelete?: number
}

/**
 * 获取小程序列表
 */
export const getMiniappList = async () => {
  try {
    const ret = await $get('/miniapp/list', {})

    if (ret.code === 1) {
      return ret.data as Miniapp[]
    } else {
      message.error(ret.msg || '获取小程序列表失败')
      return []
    }
  } catch (error) {
    console.error('获取小程序列表失败:', error)
    message.error('获取小程序列表失败')
    return []
  }
}

export const getMiniappManageList = async () => {
  try {
    const ret = await $get('/miniapp/manage/list', {})
    if (ret.code === 1) {
      return ret.data as Miniapp[]
    }
    message.error(ret.codeMessage || '获取小程序管理列表失败')
    return []
  } catch (error) {
    console.error('获取小程序管理列表失败:', error)
    message.error('获取小程序管理列表失败')
    return []
  }
}

export const checkMiniappRoute = async (route: string, showMessage = true) => {
  try {
    const ret = await $get('/miniapp/check-route', { route })
    if (ret.code === 1) {
      return true
    }
    if (showMessage) {
      message.warning(ret.codeMessage || '无权限查看或小程序已下架')
    }
    return false
  } catch (error) {
    console.error('小程序状态校验失败:', error)
    if (showMessage) {
      message.error('小程序状态校验失败')
    }
    return false
  }
}

export const checkMiniappAvailable = async (id: number, showMessage = true) => {
  try {
    const ret = await $get(`/miniapp/check/${id}`, {})
    if (ret.code === 1) {
      return true
    }
    if (showMessage) {
      message.warning(ret.codeMessage || '无权限查看或小程序已下架')
    }
    return false
  } catch (error) {
    console.error('小程序状态校验失败:', error)
    if (showMessage) {
      message.error('小程序状态校验失败')
    }
    return false
  }
}

export const offlineMiniapp = async (id: number) => {
  try {
    const ret = await $post('/miniapp/manage/offline', { id })
    if (ret.code === 1) {
      message.success('小程序已下架')
      return true
    }
    message.error(ret.codeMessage || '小程序下架失败')
    return false
  } catch (error) {
    console.error('小程序下架失败:', error)
    message.error('小程序下架失败')
    return false
  }
}

export const onlineMiniapp = async (id: number) => {
  try {
    const ret = await $post('/miniapp/manage/online', { id })
    if (ret.code === 1) {
      message.success('小程序已重新上架')
      return true
    }
    message.error(ret.codeMessage || '小程序上架失败')
    return false
  } catch (error) {
    console.error('小程序上架失败:', error)
    message.error('小程序上架失败')
    return false
  }
}
