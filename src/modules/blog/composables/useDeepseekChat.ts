import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import { addAuthChangeListener, isLoggedIn } from '@/shared/auth/session'
import {
  checkAdmin,
  deleteDialogue,
  getCompletionHistoryList,
  getCompletionList,
  sendCompletion,
  type DeepseekMessage,
  type DialogueHistory,
} from '@/api/deepseek'

export type ChatMessageStatus = 'done' | 'streaming' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  dialogueId?: number
  createTime?: string
  status: ChatMessageStatus
  errorMessage?: string
}

const MAX_DIALOGUE_COUNT = 10

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const toChatMessage = (messageItem: DeepseekMessage): ChatMessage => ({
  id: createMessageId(),
  role: messageItem.role,
  content: messageItem.content || '',
  dialogueId: messageItem.dialogueId,
  createTime: messageItem.createTime,
  status: 'done',
})

export function useDeepseekChat() {
  const historyList = ref<DialogueHistory[]>([])
  const messages = ref<ChatMessage[]>([])
  const currentDialogueId = ref<number | null>(null)
  const sending = ref(false)
  const loadingHistory = ref(false)
  const isAdmin = ref(false)

  const dialogueCount = computed(() => historyList.value.length)
  const isBusy = computed(() => sending.value || loadingHistory.value)
  let removeAuthChangeListener: (() => void) | null = null

  const loadHistoryList = async () => {
    historyList.value = await getCompletionHistoryList()
  }

  const loadHistory = async (dialogueId: number) => {
    loadingHistory.value = true
    try {
      const messageList = await getCompletionList(dialogueId)
      currentDialogueId.value = dialogueId
      messages.value = messageList.map(toChatMessage)
    } finally {
      loadingHistory.value = false
    }
  }

  const startNewChat = () => {
    if (!isAdmin.value && dialogueCount.value >= MAX_DIALOGUE_COUNT) {
      message.warning('您的会话额度已满，请删除历史会话后再创建新对话')
      return false
    }
    currentDialogueId.value = null
    messages.value = []
    return true
  }

  const removeDialogue = async (dialogueId: number) => {
    if (!(await confirm({ message: '确定删除该对话吗？', confirmText: '删除' }))) {
      return false
    }
    const success = await deleteDialogue(dialogueId)
    if (!success) {
      return false
    }

    await loadHistoryList()
    if (currentDialogueId.value === dialogueId) {
      currentDialogueId.value = null
      messages.value = []
    }
    return true
  }

  const sendMessage = async (rawContent: string) => {
    const content = rawContent.trim()
    if (!content || sending.value) {
      return false
    }

    if (!currentDialogueId.value && !isAdmin.value && dialogueCount.value >= MAX_DIALOGUE_COUNT) {
      message.warning('您的会话额度已满，请删除历史会话后再创建新对话')
      return false
    }

    const userMessage = reactive<ChatMessage>({
      id: createMessageId(),
      role: 'user',
      content,
      dialogueId: currentDialogueId.value ?? undefined,
      status: 'done',
    })
    const assistantMessage = reactive<ChatMessage>({
      id: createMessageId(),
      role: 'assistant',
      content: '',
      dialogueId: currentDialogueId.value ?? undefined,
      status: 'streaming',
    })

    messages.value.push(userMessage, assistantMessage)
    sending.value = true

    let streamError = ''
    let donePayload: { content?: string } | null = null

    try {
      await sendCompletion(content, currentDialogueId.value, {
        onMeta(meta) {
          currentDialogueId.value = meta.dialogueId
          userMessage.dialogueId = meta.dialogueId
          assistantMessage.dialogueId = meta.dialogueId
        },
        onDelta(chunk) {
          currentDialogueId.value = chunk.dialogueId
          assistantMessage.dialogueId = chunk.dialogueId
          assistantMessage.content = `${assistantMessage.content}${chunk.content || ''}`
        },
        onDone(payload) {
          currentDialogueId.value = payload.dialogueId
          userMessage.dialogueId = payload.dialogueId
          assistantMessage.dialogueId = payload.dialogueId
          donePayload = payload
        },
        onError(messageText, dialogueId) {
          streamError = messageText || '发送消息失败'
          if (dialogueId) {
            currentDialogueId.value = dialogueId
            userMessage.dialogueId = dialogueId
            assistantMessage.dialogueId = dialogueId
          }
          assistantMessage.status = 'error'
          assistantMessage.errorMessage = streamError
          if (!assistantMessage.content) {
            assistantMessage.content = streamError
          }
        },
      })

      if (streamError) {
        message.error(streamError)
        return false
      }

      if (donePayload?.content) {
        assistantMessage.content = donePayload.content
      }
      assistantMessage.status = 'done'
      return true
    } catch (error) {
      const errorMessage = (error as Error).message || '发送消息失败，请稍后重试'
      assistantMessage.status = 'error'
      assistantMessage.errorMessage = errorMessage
      if (!assistantMessage.content) {
        assistantMessage.content = errorMessage
      }
      message.error(errorMessage)
      return false
    } finally {
      sending.value = false
      await loadHistoryList()
    }
  }

  const refreshLoginState = async () => {
    if (!isLoggedIn()) {
      isAdmin.value = false
      currentDialogueId.value = null
      historyList.value = []
      messages.value = []
      return
    }

    isAdmin.value = await checkAdmin()
    await loadHistoryList()
  }

  const initialize = async () => {
    await refreshLoginState()
  }

  onMounted(() => {
    removeAuthChangeListener = addAuthChangeListener(() => {
      void refreshLoginState()
    })
  })

  onBeforeUnmount(() => {
    removeAuthChangeListener?.()
    removeAuthChangeListener = null
  })

  return {
    currentDialogueId,
    dialogueCount,
    historyList,
    isAdmin,
    isBusy,
    loadingHistory,
    messages,
    sending,
    initialize,
    loadHistory,
    loadHistoryList,
    removeDialogue,
    sendMessage,
    startNewChat,
  }
}
