<template>
  <div class="deepseek-container">
    <!-- 顶部导航 -->
    <div class="deepseek-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <el-dropdown trigger="click" @command="handleSelectHistory" class="history-dropdown">
        <span class="history-btn">
          <el-icon><Clock /></el-icon>
          历史对话
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="historyList.length === 0" disabled>
              暂无历史对话
            </el-dropdown-item>
            <el-dropdown-item
              v-for="item in historyList"
              :key="item.dialogueId"
              :command="item.dialogueId"
              @mousedown.native="startLongPress(item.dialogueId)"
              @mouseup.native="cancelLongPress"
              @mouseleave.native="cancelLongPress"
              @touchstart="startLongPress(item.dialogueId)"
              @touchend="cancelLongPress"
              @touchcancel="cancelLongPress"
            >
              <div class="history-item">
                <span class="history-title">{{ formatHistoryTitle(item.content) }}</span>
                <span class="history-time">{{ formatTime(item.createTime) }}</span>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-icon class="new-icon" @click="startNewChat"><Plus /></el-icon>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="msg.role"
      >
        <el-avatar :size="36" class="message-avatar" :class="msg.role">
          {{ msg.role === 'user' ? '我' : 'AI' }}
        </el-avatar>
        <div class="message-bubble" v-html="renderMarkdown(msg.content)"></div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="message-item assistant">
        <el-avatar :size="36" class="message-avatar assistant">AI</el-avatar>
        <div class="message-bubble typing">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div v-if="messages.length === 0 && !loading" class="empty-tip">
        <el-icon :size="48"><ChatDotRound /></el-icon>
        <p>开始与 AI 对话吧</p>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area safe-area-bottom">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="1"
        :autosize="{ minRows: 1, maxRows: 4 }"
        placeholder="输入消息..."
        :disabled="loading"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <el-button
        type="primary"
        circle
        :disabled="!inputText.trim() || loading"
        @click="sendMessage"
      >
        <el-icon><Position /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowDown, Plus, ChatDotRound, Position, Clock } from '@element-plus/icons-vue'
import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import { sendCompletion, getCompletionHistoryList, getCompletionList, deleteDialogue, checkAdmin, type Message } from '../api/deepseek'
import { loadMarkdownRenderer, renderPlainMarkdown, type MarkdownRenderer } from '../../shared/utils/markdown'

const router = useRouter()
const markdownRenderer = ref<MarkdownRenderer | null>(null)

const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(false)
const currentDialogueId = ref<number | null>(null)
const messageListRef = ref<HTMLElement | null>(null)
const historyList = ref<any[]>([])
const isAdmin = ref(false)
const MAX_DIALOGUE_COUNT = 10

// 长按相关
let longPressTimer: number | null = null
const LONG_PRESS_DURATION = 800

const goBack = () => {
  router.push('/')
}

const startNewChat = () => {
  // 非管理员检查对话数量限制
  if (!isAdmin.value && historyList.value.length >= MAX_DIALOGUE_COUNT) {
    message.warning('您的会话额度已满，请删除历史会话后再创建新对话')
    return
  }
  messages.value = []
  currentDialogueId.value = null
}

// 长按开始
const startLongPress = (dialogueId: number) => {
  longPressTimer = window.setTimeout(() => {
    handleDeleteDialogue(dialogueId)
  }, LONG_PRESS_DURATION)
}

// 取消长按
const cancelLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

// 删除对话
const handleDeleteDialogue = async (dialogueId: number) => {
  if (!(await confirm({ message: '确定删除该对话吗？', confirmText: '删除' }))) return
  const success = await deleteDialogue(dialogueId)
  if (success) {
    await loadHistoryList()
    if (currentDialogueId.value === dialogueId) {
      currentDialogueId.value = null
      messages.value = []
    }
  }
}

const renderMarkdown = (content: string) => {
  return markdownRenderer.value?.render(content) ?? renderPlainMarkdown(content)
}

const formatTime = (time: string) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatHistoryTitle = (content: string) => {
  if (!content) return '未命名对话'
  return content.length > 10 ? content.substring(0, 10) + '...' : content
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const loadHistoryList = async () => {
  historyList.value = await getCompletionHistoryList()
}

const handleSelectHistory = async (dialogueId: number) => {
  currentDialogueId.value = dialogueId
  loading.value = true
  try {
    const list = await getCompletionList(dialogueId)
    messages.value = list
    scrollToBottom()
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim() || loading.value) return

  // 非管理员创建新对话时检查对话数量限制
  if (!currentDialogueId.value && !isAdmin.value && historyList.value.length >= MAX_DIALOGUE_COUNT) {
    message.warning('您的会话额度已满，请删除历史会话后再创建新对话')
    return
  }

  const content = inputText.value.trim()
  messages.value.push({ role: 'user', content })
  inputText.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const response = await sendCompletion(content, currentDialogueId.value)
    if (response) {
      if (!currentDialogueId.value) {
        currentDialogueId.value = response.dialogueId
        // 刷新历史列表
        loadHistoryList()
      }
      messages.value.push({
        role: 'assistant',
        content: response.content,
        dialogueId: response.dialogueId
      })
      scrollToBottom()
    }
  } catch (error) {
    console.error('发送失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  markdownRenderer.value = await loadMarkdownRenderer()
  isAdmin.value = await checkAdmin()
  loadHistoryList()
  scrollToBottom()
})

onUnmounted(() => {
  cancelLongPress()
})
</script>

<style scoped lang="scss">
.deepseek-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.deepseek-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  .back-icon, .new-icon {
    font-size: 22px;
    color: #333;
    cursor: pointer;
  }

  .history-dropdown {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .history-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 15px;
    color: #333;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 20px;
    background: #f5f5f5;

    &:hover {
      background: #eee;
    }
  }
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 150px;

  .history-title {
    font-size: 14px;
    color: #333;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-time {
    font-size: 12px;
    color: #999;
  }
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;

  .message-item {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;

    &.user {
      flex-direction: row-reverse;

      .message-avatar {
        background: #409EFF;
      }

      .message-bubble {
        background: #409EFF;
        color: #fff;
        border-radius: 16px 4px 16px 16px;
      }
    }

    &.assistant {
      .message-avatar {
        background: #67C23A;
      }

      .message-bubble {
        background: #fff;
        border-radius: 4px 16px 16px 16px;
      }
    }

    .message-avatar {
      flex-shrink: 0;
      color: #fff;
      font-size: 12px;
    }

    .message-bubble {
      max-width: 75%;
      padding: 12px 15px;
      font-size: 15px;
      line-height: 1.6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      &.typing {
        display: flex;
        gap: 4px;
        padding: 15px;

        span {
          width: 8px;
          height: 8px;
          background: #999;
          border-radius: 50%;
          animation: typing 1.4s infinite;

          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }

      :deep(p) {
        margin: 0 0 8px;
        &:last-child { margin: 0; }
      }

      :deep(pre) {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 13px;
      }

      :deep(code) {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 13px;
      }
    }
  }

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;

    p {
      margin-top: 15px;
      font-size: 14px;
    }
  }
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 15px;
  background: #fff;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.05);

  :deep(.el-textarea__inner) {
    border-radius: 20px;
    padding: 10px 15px;
    resize: none;
  }

  .el-button {
    flex-shrink: 0;
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}
</style>
