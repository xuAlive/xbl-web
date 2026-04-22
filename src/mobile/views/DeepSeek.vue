<template>
  <div class="deepseek-mobile-page">
    <header class="mobile-header">
      <button class="header-icon" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <div class="header-title">
        <span>DeepSeek</span>
        <small>{{ sending ? '回复生成中' : '智能对话' }}</small>
      </div>
      <div class="header-actions">
        <button class="header-icon" @click="historyVisible = true">
          <el-icon><Clock /></el-icon>
        </button>
        <button class="header-icon" @click="handleNewChat">
          <el-icon><Plus /></el-icon>
        </button>
      </div>
    </header>

    <div ref="messageListRef" class="mobile-body">
      <div v-if="messages.length === 0" class="mobile-welcome">
        <div class="welcome-logo">DS</div>
        <h2>流式对话已接入</h2>
        <p>回复会像主流 AI 产品一样实时滚动输出，支持历史会话继续追问。</p>
        <div class="mobile-prompts">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            class="mobile-prompt"
            @click="inputText = prompt"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <article
        v-for="item in messages"
        :key="item.id"
        class="mobile-message"
        :class="item.role"
      >
        <div class="mobile-avatar" :class="item.role">
          {{ item.role === 'user' ? '我' : 'DS' }}
        </div>
        <div class="mobile-bubble" :class="item.status">
          <div v-if="item.content" class="mobile-content markdown-body" v-html="renderMarkdown(item.content)"></div>
          <div v-else-if="item.status === 'streaming'" class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <p v-if="item.status === 'error'" class="message-error">
            {{ item.errorMessage || '响应异常，请稍后再试' }}
          </p>
        </div>
      </article>
    </div>

    <footer class="mobile-composer safe-area-bottom">
      <div class="composer-box">
        <el-input
          v-model="inputText"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          resize="none"
          placeholder="输入消息，Enter 发送"
          :disabled="isBusy"
          @keydown.enter.exact.prevent="handleSend"
        />
        <div class="composer-actions">
          <span>{{ dialogueCount }}/{{ isAdmin ? '∞' : dialogueLimit }} 会话</span>
          <el-button
            type="primary"
            circle
            class="send-icon-btn"
            :disabled="!inputText.trim()"
            :loading="sending"
            @click="handleSend"
          >
            <el-icon><Position /></el-icon>
          </el-button>
        </div>
      </div>
    </footer>

    <el-drawer v-model="historyVisible" title="历史会话" size="82%" append-to-body>
      <div class="drawer-tip">普通用户最多保留 {{ dialogueLimit }} 个会话</div>
      <div class="drawer-history-list">
        <div
          v-for="item in historyList"
          :key="item.dialogueId"
          class="drawer-history-card"
          :class="{ active: currentDialogueId === item.dialogueId }"
          @click="handleSelectDialogue(item.dialogueId)"
        >
          <div class="drawer-history-top">
            <strong>{{ formatHistoryPreview(item.content) }}</strong>
            <el-button
              text
              circle
              class="history-delete"
              @click.stop="handleDeleteDialogue(item.dialogueId)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <p>{{ item.content || '未命名对话' }}</p>
          <time>{{ formatTime(item.createTime) }}</time>
        </div>

        <el-empty
          v-if="historyList.length === 0"
          description="暂无历史会话"
          :image-size="88"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Clock, Delete, Plus, Position } from '@element-plus/icons-vue'

import { loadMarkdownRenderer, renderPlainMarkdown, type MarkdownRenderer } from '@/shared/utils/markdown'
import { useDeepseekChat } from '@/modules/blog/composables/useDeepseekChat'

const router = useRouter()
const dialogueLimit = 10
const quickPrompts = [
  '给我一版简洁日报',
  '把这段话优化成正式表达',
  '整理成待办清单',
]

const historyVisible = ref(false)
const inputText = ref('')
const markdownRenderer = ref<MarkdownRenderer | null>(null)
const messageListRef = ref<HTMLElement | null>(null)

const {
  currentDialogueId,
  dialogueCount,
  historyList,
  isAdmin,
  isBusy,
  messages,
  sending,
  initialize,
  loadHistory,
  removeDialogue,
  sendMessage,
  startNewChat,
} = useDeepseekChat()

const renderMarkdown = (content: string) => {
  return markdownRenderer.value?.render(content || '') ?? renderPlainMarkdown(content || '')
}

const formatHistoryPreview = (content?: string) => {
  const text = (content || '').trim()
  if (!text) {
    return '未命名对话'
  }
  return text.length > 14 ? `${text.slice(0, 14)}...` : text
}

const formatTime = (time?: string) => {
  if (!time) {
    return ''
  }
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (!messageListRef.value) {
    return
  }
  messageListRef.value.scrollTo({
    top: messageListRef.value.scrollHeight,
    behavior: 'smooth',
  })
}

const handleSend = async () => {
  const content = inputText.value
  if (!content.trim()) {
    return
  }
  inputText.value = ''
  const success = await sendMessage(content)
  if (!success) {
    inputText.value = content
  }
}

const handleNewChat = () => {
  if (startNewChat()) {
    inputText.value = ''
    historyVisible.value = false
  }
}

const handleSelectDialogue = async (dialogueId: number) => {
  await loadHistory(dialogueId)
  historyVisible.value = false
}

const handleDeleteDialogue = async (dialogueId: number) => {
  await removeDialogue(dialogueId)
}

const goBack = () => {
  router.push('/')
}

watch(
  messages,
  async () => {
    await scrollToBottom()
  },
  { deep: true },
)

onMounted(async () => {
  await initialize()
  try {
    markdownRenderer.value = await loadMarkdownRenderer({ codeHighlight: true })
  } catch (error) {
    console.error('加载移动端 DeepSeek Markdown 渲染器失败:', error)
  }
})

onActivated(async () => {
  await initialize()
})
</script>

<style scoped lang="scss">
.deepseek-mobile-page {
  --text-main: #172033;
  --text-secondary: #667085;
  --brand: #1d4ed8;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 24%),
    linear-gradient(180deg, #f0f6ff 0%, #f8fbff 100%);
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.header-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  color: var(--text-main);
}

.header-title span {
  font-size: 17px;
  font-weight: 700;
}

.header-title small {
  margin-top: 2px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 14px;
  background: rgba(29, 78, 216, 0.08);
  color: var(--text-main);
}

.mobile-body {
  min-height: 0;
  overflow: auto;
  padding: 18px 16px 12px;
}

.mobile-welcome {
  display: grid;
  gap: 16px;
  padding: 22px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(191, 219, 254, 0.9);
}

.welcome-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.mobile-welcome h2,
.mobile-welcome p {
  margin: 0;
  color: var(--text-main);
}

.mobile-welcome p {
  color: var(--text-secondary);
  line-height: 1.7;
}

.mobile-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mobile-prompt {
  padding: 10px 14px;
  border: 1px solid rgba(29, 78, 216, 0.14);
  border-radius: 999px;
  background: rgba(29, 78, 216, 0.06);
  color: var(--text-main);
}

.mobile-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 18px;
}

.mobile-message.user {
  flex-direction: row-reverse;
}

.mobile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 14px;
  flex-shrink: 0;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.mobile-avatar.user {
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
}

.mobile-avatar.assistant {
  background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%);
}

.mobile-bubble {
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(203, 213, 225, 0.4);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.mobile-bubble.error {
  border-color: rgba(239, 68, 68, 0.24);
}

.mobile-message.user .mobile-bubble {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  color: #fff;
}

.mobile-content {
  line-height: 1.8;
}

.mobile-message.user .mobile-content {
  color: #fff;
}

.mobile-content.markdown-body :deep(> :first-child) {
  margin-top: 0;
}

.mobile-content.markdown-body :deep(> :last-child) {
  margin-bottom: 0;
}

.mobile-content.markdown-body :deep(p) {
  margin: 0;
}

.mobile-content.markdown-body :deep(p + p),
.mobile-content.markdown-body :deep(ul + p),
.mobile-content.markdown-body :deep(ol + p),
.mobile-content.markdown-body :deep(p + ul),
.mobile-content.markdown-body :deep(p + ol),
.mobile-content.markdown-body :deep(ul + ul),
.mobile-content.markdown-body :deep(ol + ol),
.mobile-content.markdown-body :deep(pre + p),
.mobile-content.markdown-body :deep(p + pre) {
  margin-top: 0.7em;
}

.mobile-content.markdown-body :deep(ul),
.mobile-content.markdown-body :deep(ol),
.mobile-content.markdown-body :deep(pre),
.mobile-content.markdown-body :deep(blockquote) {
  margin-top: 0.7em;
  margin-bottom: 0.7em;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(29, 78, 216, 0.45);
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.3s;
}

.message-error {
  margin: 10px 0 0;
  color: #dc2626;
  font-size: 12px;
}

.mobile-composer {
  padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.composer-box {
  padding: 12px;
  border-radius: 22px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.38);
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 12px;
}

.send-icon-btn {
  width: 40px;
  height: 40px;
}

.drawer-tip {
  margin-bottom: 14px;
  color: var(--text-secondary);
  font-size: 12px;
}

.drawer-history-list {
  display: grid;
  gap: 12px;
}

.drawer-history-card {
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(203, 213, 225, 0.36);
  border-radius: 18px;
  background: #fff;
  text-align: left;
}

.drawer-history-card.active {
  border-color: rgba(29, 78, 216, 0.24);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.1);
}

.drawer-history-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.drawer-history-card p,
.drawer-history-card time {
  margin: 8px 0 0;
  color: var(--text-secondary);
}

:deep(.el-textarea__inner) {
  border: 0;
  box-shadow: none;
  padding: 0;
  line-height: 1.75;
}

:deep(.markdown-body) {
  background: transparent;
  color: inherit;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.75);
    opacity: 0.35;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
