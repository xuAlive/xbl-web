import {$get, $post} from "../utils/request";
import { message } from '@/shared/ui/feedback'

/**
 * 历史对话项接口
 */
export interface DialogueHistory {
  dialogueId: number
  content: string
}

/**
 * 对话消息接口
 */
export interface Message {
  role: 'user' | 'assistant'
  content: string
  dialogueId?: number
}

/**
 * 发送消息响应接口
 */
export interface SendCompletionResponse {
  role: string
  content: string
  dialogueId: number
}

/**
 * 获取历史对话列表
 * @returns 历史对话列表
 */
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

/**
 * 获取指定对话的完整消息列表
 * @param dialogueId 对话ID
 * @returns 消息列表
 */
export const getCompletionList = async (dialogueId: number) => {
  try {
    const ret = await $get('/ds/getCompletionList', { dialogueId })

    if (ret.code === 1) {
      return ret.data as Message[]
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

/**
 * 发送消息
 * @param content 消息内容
 * @param dialogueId 对话ID（首次为null）
 * @returns 响应数据
 */
export const sendCompletion = async (content: string, dialogueId?: number | null) => {
  try {
    const params: any = {
      content,
      dialogueId: dialogueId || null
    }

    const ret = await $post('/ds/sendCompletion', JSON.stringify(params))

    if (ret.code === 1) {
      return ret.data as SendCompletionResponse
    } else {
      message.error(ret.codeMessage || '发送消息失败')
      return null
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    message.error('发送消息失败，请稍后重试')
    return null
  }
}

/**
 * 删除对话
 * @param dialogueId 对话ID
 * @returns 是否删除成功
 */
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

/**
 * 获取对话数量
 * @returns 对话数量
 */
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

/**
 * 检查是否为管理员
 * @returns 是否为管理员
 */
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