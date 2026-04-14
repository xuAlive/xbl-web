import { $post, $get } from '../utils/request'
import { getAccount } from '../utils/auth'
import { message } from '@/shared/ui/feedback'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  dialogueId?: number
}

export interface CompletionResponse {
  dialogueId: number
  content: string
}

// 发送对话
export const sendCompletion = async (content: string, dialogueId: number | null): Promise<CompletionResponse | null> => {
  try {
    const account = getAccount()
    if (!account) return null

    const params: any = { account, content }
    if (dialogueId) {
      params.dialogueId = dialogueId
    }

    const ret = await $post('/ds/sendCompletion', params)
    if (ret.code === 1) {
      return ret.data as CompletionResponse
    }
    return null
  } catch (error) {
    console.error('发送消息失败:', error)
    return null
  }
}

// 获取历史对话列表
export const getCompletionHistoryList = async () => {
  try {
    const account = getAccount()
    if (!account) return []

    const ret = await $get('/ds/getCompletionHistoryList', { account })
    if (ret.code === 1) {
      return ret.data || []
    }
    return []
  } catch (error) {
    console.error('获取历史列表失败:', error)
    return []
  }
}

// 获取对话消息列表
export const getCompletionList = async (dialogueId: number): Promise<Message[]> => {
  try {
    const ret = await $get('/ds/getCompletionList', { dialogueId })
    if (ret.code === 1) {
      return ret.data || []
    }
    return []
  } catch (error) {
    console.error('获取消息列表失败:', error)
    return []
  }
}

// 删除对话
export const deleteDialogue = async (dialogueId: number): Promise<boolean> => {
  try {
    const ret = await $post(`/ds/deleteDialogue`, { id: dialogueId })
    if (ret.code === 1) {
      message.success('删除成功')
      return true
    } else {
      message.error(ret.codeMessage || '删除失败')
      return false
    }
  } catch (error) {
    console.error('删除对话失败:', error)
    message.error('删除失败')
    return false
  }
}

// 获取对话数量
export const getDialogueCount = async (): Promise<number> => {
  try {
    const ret = await $get('/ds/getDialogueCount', {})
    if (ret.code === 1) {
      return ret.data as number
    }
    return 0
  } catch (error) {
    console.error('获取对话数量失败:', error)
    return 0
  }
}

// 检查是否为管理员
export const checkAdmin = async (): Promise<boolean> => {
  try {
    const ret = await $get('/ds/checkAdmin', {})
    if (ret.code === 1) {
      return ret.data as boolean
    }
    return false
  } catch (error) {
    console.error('检查管理员权限失败:', error)
    return false
  }
}
