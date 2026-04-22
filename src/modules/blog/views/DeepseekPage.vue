<template>
  <div class="deepseek-page">
    <aside class="history-panel">
      <div class="panel-header">
        <div>
          <h2>历史会话</h2>
        </div>
        <el-button type="primary" class="new-chat-btn" @click="handleNewChat">
          <el-icon><Plus /></el-icon>
          新对话
        </el-button>
      </div>

      <div class="history-tip">
        <span>普通用户最多保留 {{ dialogueLimit }} 个会话</span>
        <strong>{{ dialogueCount }}/{{ isAdmin ? '∞' : dialogueLimit }}</strong>
      </div>

      <el-scrollbar class="history-scrollbar">
        <div class="history-list">
          <div
            v-for="item in historyList"
            :key="item.dialogueId"
            class="history-card"
            :class="{ active: currentDialogueId === item.dialogueId }"
            @click="handleSelectDialogue(item.dialogueId)"
          >
            <div class="history-card-top">
              <span class="history-title">{{ formatHistoryPreview(item.content) }}</span>
              <el-button
                text
                circle
                class="history-delete"
                @click.stop="handleDeleteDialogue(item.dialogueId)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <p class="history-preview">{{ item.content || '未命名对话' }}</p>
            <time class="history-time">{{ formatTime(item.createTime) }}</time>
          </div>

          <el-empty
            v-if="historyList.length === 0"
            description="还没有历史会话"
            :image-size="88"
          />
        </div>
      </el-scrollbar>
    </aside>

    <section class="chat-panel">
      <header class="chat-header">
        <div>
          <h1>DeepSeek 智能对话</h1>
        </div>
        <div class="chat-header-badge">
          <span class="badge-dot"></span>
          {{ sending ? '正在生成回复' : '随时开始新话题' }}
        </div>
      </header>

      <div ref="messageListRef" class="chat-body">
        <div v-if="messages.length === 0" class="welcome-card">
          <div class="welcome-mark">DS</div>
          <h3>像主流 AI 对话产品一样，边生成边展示</h3>
          <p>支持 Markdown 渲染、历史会话切换、流式逐字输出，长回答会自动连续追加。</p>
          <div class="quick-prompts">
            <button
              v-for="prompt in quickPrompts"
              :key="prompt"
              class="quick-prompt"
              @click="applyQuickPrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <article
          v-for="item in messages"
          :key="item.id"
          class="message-row"
          :class="item.role"
        >
          <div class="message-avatar" :class="item.role">
            {{ item.role === 'user' ? '我' : 'DS' }}
          </div>

          <div class="message-card" :class="item.status">
            <div v-if="item.content" class="message-content markdown-body" v-html="renderMarkdown(item.content)"></div>
            <div v-else-if="item.status === 'streaming'" class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <p v-if="item.status === 'error'" class="message-error">
              {{ item.errorMessage || '本次响应异常，请稍后重试' }}
            </p>
          </div>
        </article>
      </div>

      <footer class="composer-panel">
        <div class="composer-shell">
          <el-input
            v-model="inputContent"
            type="textarea"
            :rows="4"
            resize="none"
            placeholder="输入消息，按 Enter 发送，Shift + Enter 换行"
            :disabled="isBusy"
            @keydown.enter.exact.prevent="handleSend"
          />
          <div class="composer-footer">
            <span>支持 Markdown 回复、历史会话续聊、流式内容实时渲染</span>
            <el-button
              type="primary"
              class="send-btn"
              :loading="sending"
              :disabled="!inputContent.trim()"
              @click="handleSend"
            >
              发送消息
            </el-button>
          </div>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onActivated, onMounted, ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'

import { loadMarkdownRenderer, renderPlainMarkdown, type MarkdownRenderer } from '@/shared/utils/markdown'
import { useDeepseekChat } from '@/modules/blog/composables/useDeepseekChat'

const dialogueLimit = 10
const quickPrompts = [
  '帮我总结今天的工作重点',
  '把这段内容整理成 Markdown 提纲',
  '给我一版更专业但简洁的回复',
]

const markdownRenderer = ref<MarkdownRenderer | null>(null)
const inputContent = ref('')
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
  return text.length > 18 ? `${text.slice(0, 18)}...` : text
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
  const content = inputContent.value
  if (!content.trim()) {
    return
  }
  inputContent.value = ''
  const success = await sendMessage(content)
  if (!success) {
    inputContent.value = content
  }
}

const handleNewChat = () => {
  if (startNewChat()) {
    inputContent.value = ''
  }
}

const handleSelectDialogue = async (dialogueId: number) => {
  await loadHistory(dialogueId)
}

const handleDeleteDialogue = async (dialogueId: number) => {
  await removeDialogue(dialogueId)
}

const applyQuickPrompt = (prompt: string) => {
  inputContent.value = prompt
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
    console.error('加载 DeepSeek Markdown 渲染器失败:', error)
  }
})

onActivated(async () => {
  await initialize()
})
</script>

<style scoped lang="scss">
.deepseek-page {
  --surface: rgba(255, 255, 255, 0.9);
  --surface-strong: #ffffff;
  --border: rgba(148, 163, 184, 0.24);
  --text-main: #162033;
  --text-secondary: #5b667a;
  --brand: #1d4ed8;
  --brand-soft: rgba(29, 78, 216, 0.12);
  --assistant: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  --user: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  display: grid;
  grid-template-columns: 310px minmax(0, 1fr);
  gap: 20px;
  height: 100%;
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(30, 64, 175, 0.12), transparent 32%),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 28%),
    linear-gradient(180deg, #eef4ff 0%, #f8fbff 100%);
  box-sizing: border-box;
}

.history-panel,
.chat-panel {
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: var(--surface);
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.history-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header,
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 18px;
}

.panel-header h2,
.chat-header h1 {
  margin: 0;
  color: var(--text-main);
}

.new-chat-btn {
  border-radius: 999px;
}

.history-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 20px 20px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-secondary);
  font-size: 13px;
}

.history-tip strong {
  color: var(--brand);
  font-size: 15px;
}

.history-scrollbar {
  flex: 1;
  min-height: 0;
}

.history-list {
  display: grid;
  gap: 12px;
  padding: 0 20px 20px;
}

.history-card {
  width: 100%;
  padding: 16px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.75);
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.history-card:hover,
.history-card.active {
  transform: translateY(-1px);
  border-color: rgba(29, 78, 216, 0.24);
  box-shadow: 0 16px 28px rgba(59, 130, 246, 0.12);
}

.history-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.history-delete {
  color: #94a3b8;
}

.history-preview,
.history-time {
  margin: 10px 0 0;
  color: var(--text-secondary);
}

.history-preview {
  font-size: 13px;
  line-height: 1.6;
}

.history-time {
  display: block;
  font-size: 12px;
}

.chat-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.chat-header {
  border-bottom: 1px solid var(--border);
}

.chat-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-secondary);
  font-size: 13px;
}

.badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
}

.chat-body {
  min-height: 0;
  overflow: auto;
  padding: 28px 32px 20px;
}

.welcome-card {
  display: grid;
  gap: 18px;
  justify-items: start;
  max-width: 760px;
  padding: 32px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 247, 255, 0.9) 100%);
  border: 1px solid rgba(191, 219, 254, 0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.welcome-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.welcome-card h3,
.welcome-card p {
  margin: 0;
  color: var(--text-main);
}

.welcome-card p {
  color: var(--text-secondary);
  line-height: 1.8;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-prompt {
  padding: 12px 18px;
  border: 1px solid rgba(29, 78, 216, 0.16);
  border-radius: 999px;
  background: rgba(29, 78, 216, 0.06);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.18s ease;
}

.quick-prompt:hover {
  background: rgba(29, 78, 216, 0.12);
  transform: translateY(-1px);
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  margin: 0 0 22px;
}

.message-row.user {
  flex-direction: row-reverse;
}

.message-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.14);
}

.message-avatar.user {
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
}

.message-avatar.assistant {
  background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%);
}

.message-card {
  display: inline-block;
  flex: 0 1 auto;
  min-width: 0;
  inline-size: fit-content;
  max-inline-size: min(78%, 860px);
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(203, 213, 225, 0.4);
  background: var(--assistant);
}

.message-row.user .message-card {
  background: var(--user);
  color: #fff;
}

.message-card.error {
  border-color: rgba(239, 68, 68, 0.24);
  background: linear-gradient(135deg, #fff5f5 0%, #fff7f7 100%);
}

.message-row.user .message-card :deep(p),
.message-row.user .message-card :deep(li),
.message-row.user .message-card :deep(code) {
  color: inherit;
}

.message-content {
  line-height: 1.82;
  color: var(--text-main);
}

.message-row.user .message-content {
  color: #fff;
}

.message-content.markdown-body :deep(> :first-child) {
  margin-top: 0;
}

.message-content.markdown-body :deep(> :last-child) {
  margin-bottom: 0;
}

.message-content.markdown-body :deep(p) {
  margin: 0;
}

.message-content.markdown-body :deep(p + p),
.message-content.markdown-body :deep(ul + p),
.message-content.markdown-body :deep(ol + p),
.message-content.markdown-body :deep(p + ul),
.message-content.markdown-body :deep(p + ol),
.message-content.markdown-body :deep(ul + ul),
.message-content.markdown-body :deep(ol + ol),
.message-content.markdown-body :deep(pre + p),
.message-content.markdown-body :deep(p + pre) {
  margin-top: 0.7em;
}

.message-content.markdown-body :deep(ul),
.message-content.markdown-body :deep(ol),
.message-content.markdown-body :deep(pre),
.message-content.markdown-body :deep(blockquote) {
  margin-top: 0.7em;
  margin-bottom: 0.7em;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(29, 78, 216, 0.48);
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.3s;
}

.message-error {
  margin: 12px 0 0;
  color: #dc2626;
  font-size: 13px;
}

.composer-panel {
  padding: 18px 24px 24px;
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.72);
}

.composer-shell {
  padding: 16px;
  border-radius: 24px;
  background: var(--surface-strong);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.36);
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.send-btn {
  min-width: 120px;
  border-radius: 999px;
}

:deep(.el-textarea__inner) {
  min-height: 108px !important;
  border: 0;
  box-shadow: none;
  font-size: 15px;
  line-height: 1.8;
  padding: 0;
}

:deep(.markdown-body) {
  background: transparent;
  color: inherit;
}

:deep(.markdown-body pre) {
  border-radius: 16px;
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

@media (max-width: 1200px) {
  .deepseek-page {
    grid-template-columns: 280px minmax(0, 1fr);
    padding: 18px;
  }
}

@media (max-width: 900px) {
  .deepseek-page {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100%;
  }

  .history-panel {
    max-height: 320px;
  }

  .chat-body {
    padding: 22px 18px 18px;
  }

  .message-card {
    max-inline-size: min(88%, 100%);
  }

  .composer-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .send-btn {
    width: 100%;
  }
}
</style>
