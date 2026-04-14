import { $get, $post } from '@/utils/request'
import { message } from '@/shared/ui/feedback'

export interface SystemMessage {
  id: number
  title: string
  content: string
  creatorAccount: string
  status: number
  createTime?: string
  updateTime?: string
}

export const getSystemMessageList = async () => {
  try {
    const ret = await $get('/system-message/list', {})
    if (ret.code === 1) {
      return ret.data as SystemMessage[]
    }
    return []
  } catch (error) {
    console.error('获取系统消息失败:', error)
    return []
  }
}

export const getLatestSystemMessage = async () => {
  try {
    const ret = await $get('/system-message/latest', {})
    if (ret.code === 1) {
      return (ret.data || null) as SystemMessage | null
    }
    return null
  } catch (error) {
    console.error('获取最新系统消息失败:', error)
    return null
  }
}

export const createSystemMessage = async (payload: { title: string; content: string }) => {
  try {
    const ret = await $post('/system-message/create', payload)
    if (ret.code === 1) {
      message.success('系统消息发布成功')
      return ret.data as SystemMessage
    }
    message.error(ret.codeMessage || '系统消息发布失败')
    return null
  } catch (error) {
    console.error('系统消息发布失败:', error)
    message.error('系统消息发布失败')
    return null
  }
}
