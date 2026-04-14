<template>
  <div class="deepseek-container">
    <el-container class="chat-layout">
      <el-aside width="280px" class="history-aside">
        <div class="history-header">
          <h3>历史对话</h3>
          <el-tooltip content="长按对话可删除" placement="bottom">
            <el-button type="primary" size="small" @click="startNewChat" icon="Plus">
              新对话
            </el-button>
          </el-tooltip>
        </div>

        <el-scrollbar class="history-scrollbar">
          <div class="history-list">
            <div
              v-for="history in historyList"
              :key="history.dialogueId"
              class="history-item"
              :class="{ active: currentDialogueId === history.dialogueId }"
              @click="loadHistory(history.dialogueId)"
              @mousedown="startLongPress(history.dialogueId)"
              @mouseup="cancelLongPress"
              @mouseleave="cancelLongPress"
            >
              <div class="history-content">
                {{ history.content }}
              </div>
            </div>

            <el-empty
              v-if="historyList.length === 0"
              description="暂无历史对话"
              :image-size="80"
            />
          </div>
        </el-scrollbar>
      </el-aside>

      <el-main class="chat-main">
        <div class="chat-content">
          <el-scrollbar ref="scrollbarRef" class="message-scrollbar">
            <div class="message-list">
              <div
                v-for="(message, index) in messages"
                :key="index"
                class="message-item"
                :class="message.role"
              >
                <div class="message-avatar">
                  <el-avatar v-if="message.role === 'user'" :size="36">
                    用户
                  </el-avatar>
                  <el-avatar v-else :size="36" style="background-color: #409eff">
                    AI
                  </el-avatar>
                </div>
                <div class="message-bubble">
                  <div class="message-content markdown-body" v-html="renderMarkdown(message.content)"></div>
                </div>
              </div>

              <div v-if="loading" class="message-item assistant">
                <div class="message-avatar">
                  <el-avatar :size="36" style="background-color: #409eff">
                    AI
                  </el-avatar>
                </div>
                <div class="message-bubble">
                  <div class="message-content typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>

              <el-empty
                v-if="messages.length === 0 && !loading"
                description="开始新的对话吧"
                :image-size="120"
              />
            </div>
          </el-scrollbar>

          <div class="input-area">
            <el-input
              v-model="inputContent"
              type="textarea"
              :rows="3"
              placeholder="请输入消息内容，按 Enter 发送，Shift + Enter 换行"
              :disabled="loading"
              @keydown.enter="handleKeyDown"
              class="chat-input"
            />
            <div class="input-actions">
              <span class="input-tip">Enter 发送 / Shift + Enter 换行</span>
              <el-button
                type="primary"
                @click="sendMessage"
                :loading="loading"
                :disabled="!inputContent.trim()"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import {
  getCompletionHistoryList,
  getCompletionList,
  sendCompletion,
  deleteDialogue,
  checkAdmin,
  type DialogueHistory,
  type Message
} from '@/api/deepseek'
import { loadMarkdownRenderer, renderPlainMarkdown, type MarkdownRenderer } from '@/shared/utils/markdown'

const markdownRenderer = ref<MarkdownRenderer | null>(null)

const renderMarkdown = (content: string) => {
  return markdownRenderer.value?.render(content) ?? renderPlainMarkdown(content)
}

const historyList = ref<DialogueHistory[]>([])
const messages = ref<Message[]>([])
const inputContent = ref('')
const loading = ref(false)
const currentDialogueId = ref<number | null>(null)
const scrollbarRef = ref()
const isAdmin = ref(false)
const dialogueCount = ref(0)
const MAX_DIALOGUE_COUNT = 10

let longPressTimer: number | null = null
const LONG_PRESS_DURATION = 800

const startLongPress = (dialogueId: number) => {
  longPressTimer = window.setTimeout(() => {
    handleDeleteDialogue(dialogueId)
  }, LONG_PRESS_DURATION)
}

const cancelLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

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

const loadHistoryList = async () => {
  const list = await getCompletionHistoryList()
  historyList.value = list
  dialogueCount.value = list.length
}

const loadHistory = async (dialogueId: number) => {
  currentDialogueId.value = dialogueId
  const messageList = await getCompletionList(dialogueId)
  messages.value = messageList
  scrollToBottom()
}

const startNewChat = async () => {
  if (!isAdmin.value && dialogueCount.value >= MAX_DIALOGUE_COUNT) {
    message.warning('您的会话额度已满，请删除历史会话后再创建新对话')
    return
  }
  currentDialogueId.value = null
  messages.value = []
  inputContent.value = ''
}

const sendMessage = async () => {
  if (!inputContent.value.trim() || loading.value) return

  if (!currentDialogueId.value && !isAdmin.value && dialogueCount.value >= MAX_DIALOGUE_COUNT) {
    message.warning('您的会话额度已满，请删除历史会话后再创建新对话')
    return
  }

  const content = inputContent.value.trim()
  messages.value.push({
    role: 'user',
    content
  })

  inputContent.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const response = await sendCompletion(content, currentDialogueId.value)

    if (response) {
      if (!currentDialogueId.value) {
        currentDialogueId.value = response.dialogueId
        await loadHistoryList()
      }

      messages.value.push({
        role: 'assistant',
        content: response.content,
        dialogueId: response.dialogueId
      })

      scrollToBottom()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    loading.value = false
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (scrollbarRef.value) {
    const scrollElement = scrollbarRef.value.$refs.wrap
    scrollElement.scrollTop = scrollElement.scrollHeight
  }
}

onMounted(async () => {
  markdownRenderer.value = await loadMarkdownRenderer({ codeHighlight: true })
  isAdmin.value = await checkAdmin()
  await loadHistoryList()
})

onUnmounted(() => {
  cancelLongPress()
})
</script>

<style scoped lang="scss">
.deepseek-container {
  height: 100%;
  max-height: 100%;
  padding: 20px;
  background: #f5f7fa;
  overflow: hidden;

  .chat-layout {
    height: 100%;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .history-aside {
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    height: 100%;

    .history-header {
      padding: 20px;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;

      h3 {
        margin: 0;
        font-size: 18px;
        color: #303133;
      }
    }

    .history-scrollbar {
      flex: 1;
      height: 0;
      overflow: hidden;
    }

    .history-list {
      padding: 10px;

      .history-item {
        padding: 12px 15px;
        margin-bottom: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        background: #f5f7fa;

        &:hover {
          background: #e4e7ed;
        }

        &.active {
          background: #409eff;
          color: white;
        }

        .history-content {
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .chat-main {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;

    .chat-content {
      height: 100%;
      display: flex;
      flex-direction: column;

      .message-scrollbar {
        flex: 1;
        height: 0;
        padding: 20px;
        overflow: hidden;
      }

      .message-list {
        .message-item {
          display: flex;
          margin-bottom: 20px;
          align-items: flex-start;

          &.user {
            flex-direction: row-reverse;

            .message-bubble {
              background: #409eff;
              color: white;
              margin-right: 12px;
              margin-left: 0;
            }
          }

          &.assistant {
            .message-bubble {
              background: #f4f4f5;
              color: #303133;
              margin-left: 12px;
            }
          }

          .message-avatar {
            flex-shrink: 0;
          }

          .message-bubble {
            max-width: 60%;
            padding: 12px 16px;
            border-radius: 8px;
            word-break: break-word;
            line-height: 1.6;

            .message-content {
              font-size: 14px;

              &.typing {
                display: flex;
                gap: 4px;

                span {
                  width: 8px;
                  height: 8px;
                  background: #909399;
                  border-radius: 50%;
                  animation: typing 1.4s infinite;

                  &:nth-child(2) {
                    animation-delay: 0.2s;
                  }

                  &:nth-child(3) {
                    animation-delay: 0.4s;
                  }
                }
              }
            }
          }
        }
      }

      .input-area {
        border-top: 1px solid #e4e7ed;
        padding: 20px;
        background: #fafafa;
        flex-shrink: 0;

        .chat-input {
          margin-bottom: 12px;
        }

        .input-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .input-tip {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.markdown-body {
  line-height: 1.8;

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h1) { font-size: 1.8em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
  :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 6px; }
  :deep(h3) { font-size: 1.25em; }
  :deep(h4) { font-size: 1.1em; }
  :deep(h5) { font-size: 1em; }
  :deep(h6) { font-size: 0.9em; color: #6a737d; }

  :deep(p) {
    margin-top: 0;
    margin-bottom: 12px;
  }

  :deep(ul), :deep(ol) {
    margin-top: 0;
    margin-bottom: 12px;
    padding-left: 2em;
  }

  :deep(li) {
    margin-bottom: 4px;
  }

  :deep(pre) {
    background: #282c34;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin: 12px 0;

    code {
      background: transparent;
      padding: 0;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
  }

  :deep(code) {
    background: #f6f8fa;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 0.9em;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    color: #e83e8c;
  }

  :deep(blockquote) {
    border-left: 4px solid #dfe2e5;
    padding: 0 16px;
    margin: 12px 0;
    color: #6a737d;
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;

    th, td {
      border: 1px solid #dfe2e5;
      padding: 8px 13px;
    }

    th {
      background: #f6f8fa;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: #f6f8fa;
    }
  }

  :deep(a) {
    color: #0366d6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 2px solid #eaecef;
    margin: 24px 0;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
  }

  :deep(strong) {
    font-weight: 600;
  }

  :deep(em) {
    font-style: italic;
  }
}

.message-item.user {
  .markdown-body {
    :deep(code) {
      background: rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.9);
    }

    :deep(pre) {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
