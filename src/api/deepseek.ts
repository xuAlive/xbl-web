import { $get, $post } from '../utils/request'
import { consumeSseResponse, createSsePostRequest } from '@/shared/http/sse'
import { message } from '@/shared/ui/feedback'

export interface DialogueHistory {
  dialogueId: number
  content: string
  createTime?: string
}

export interface DeepseekMessage {
  role: 'user' | 'assistant'
  content: string
  dialogueId: number
  createTime?: string
}

export interface DeepseekStreamMeta {
  dialogueId: number
  model: string
  role: 'assistant'
  startedAt?: string
}

export interface DeepseekStreamChunk {
  dialogueId: number
  role: string
  content: string
}

export interface DeepseekStreamDone {
  dialogueId: number
  role: 'assistant'
  model: string
  content: string
  completedAt?: string
}

interface StreamHandlers {
  onMeta?: (meta: DeepseekStreamMeta) => void
  onDelta?: (chunk: DeepseekStreamChunk) => void
  onDone?: (payload: DeepseekStreamDone) => void
  onError?: (messageText: string, dialogueId?: number) => void
}

export const getCompletionHistoryList = async () => {
  try {
    const ret = await $get('/ds/getCompletionHistoryList', {})

    if (ret.code === 1) {
      return ret.data as DialogueHistory[]
    } else {
      message.error(ret.codeMessage || '获取历史对话列表失败')
      return []
    }
  } catch (error) {
    console.error('获取历史对话列表失败:', error)
    message.error('获取历史对话列表失败，请稍后重试')
    return []
  }
}

export const getCompletionList = async (dialogueId: number) => {
  try {
    const ret = await $get('/ds/getCompletionList', { dialogueId })

    if (ret.code === 1) {
      return ret.data as DeepseekMessage[]
    } else {
      message.error(ret.codeMessage || '获取对话详情失败')
      return []
    }
  } catch (error) {
    console.error('获取对话详情失败:', error)
    message.error('获取对话详情失败，请稍后重试')
    return []
  }
}

export const sendCompletion = async (
  content: string,
  dialogueId?: number | null,
  handlers: StreamHandlers = {},
) => {
  const response = await createSsePostRequest('/ds/sendCompletion', {
    content,
    dialogueId: dialogueId || null,
  })

  await consumeSseResponse(response, ({ event, data }) => {
    const payload = JSON.parse(data)
    if (event === 'meta') {
      handlers.onMeta?.(payload as DeepseekStreamMeta)
    } else if (event === 'delta') {
      handlers.onDelta?.(payload as DeepseekStreamChunk)
    } else if (event === 'done') {
      handlers.onDone?.(payload as DeepseekStreamDone)
    } else if (event === 'error') {
      handlers.onError?.((payload as { message?: string }).message || '发送消息失败', (payload as { dialogueId?: number }).dialogueId)
    }
  })
}

export const deleteDialogue = async (dialogueId: number) => {
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
    message.error('删除失败，请稍后重试')
    return false
  }
}

export const getDialogueCount = async () => {
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

export const checkAdmin = async () => {
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
