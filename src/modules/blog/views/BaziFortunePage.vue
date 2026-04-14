<template>
  <div class="fortune-page">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">AI 命理小程序</p>
        <h1>八字运势</h1>
        <p class="hero-desc">输入出生时间，先生成生辰八字，再由 DeepSeek 进行流式命理分析。</p>
      </div>
      <div class="hero-pills">
        <span>生辰八字</span>
        <span>流式输出</span>
        <span>历史留存</span>
      </div>
    </section>

    <div class="fortune-grid">
      <el-card class="panel form-panel" shadow="hover">
        <template #header>
          <div class="panel-header">
            <div>
              <h3>输入信息</h3>
              <p>出生日期和时辰越准确，结果越完整。</p>
            </div>
          </div>
        </template>

        <el-form label-position="top" class="fortune-form">
          <el-form-item label="农历出生日期">
            <el-input v-model="form.birthDateText" placeholder="例如：1999-01-11" maxlength="10" />
            <div class="field-hint">按农历输入 `YYYY-MM-DD`，前端会做格式校验。</div>
          </el-form-item>
          <el-form-item label="出生时间">
            <el-input v-model="form.birthTime" placeholder="例如：08:30" maxlength="5" />
          </el-form-item>
          <el-form-item label="是否闰月">
            <el-switch v-model="form.leapMonth" inline-prompt active-text="是" inactive-text="否" />
          </el-form-item>
          <el-form-item label="性别">
            <el-segmented v-model="form.gender" :options="genderOptions" block />
          </el-form-item>
          <el-form-item label="想重点看看什么">
            <el-input
              v-model="form.question"
              type="textarea"
              :rows="4"
              maxlength="200"
              show-word-limit
              placeholder="例如：最近事业发展、感情走势、财运方向"
            />
          </el-form-item>
          <el-button type="warning" class="submit-btn" :loading="streaming" @click="submit">
            开始测算
          </el-button>
        </el-form>
      </el-card>

      <div class="content-column">
        <el-card class="panel summary-panel" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>命盘摘要</h3>
                <p>先由后端生成八字，再把结构化结果推到页面。</p>
              </div>
            </div>
          </template>

          <el-empty v-if="!currentMeta && !currentDetail" description="测算后这里会显示八字信息" :image-size="90" />

          <template v-else>
            <div class="pillars">
              <div class="pillar-card">
                <span>年柱</span>
                <strong>{{ displayedYearPillar }}</strong>
              </div>
              <div class="pillar-card">
                <span>月柱</span>
                <strong>{{ displayedMonthPillar }}</strong>
              </div>
              <div class="pillar-card">
                <span>日柱</span>
                <strong>{{ displayedDayPillar }}</strong>
              </div>
              <div class="pillar-card">
                <span>时柱</span>
                <strong>{{ displayedHourPillar }}</strong>
              </div>
            </div>
            <div class="meta-strip">
              <span>八字：{{ displayedBaZi }}</span>
              <span>生肖：{{ displayedZodiac }}</span>
              <span v-if="displayedShiChen">时辰：{{ displayedShiChen }}</span>
              <span v-if="displayedLunarText">农历：{{ displayedLunarText }}</span>
              <span v-if="displayedSolarDate">公历：{{ displayedSolarDate }}</span>
            </div>
          </template>
        </el-card>

        <el-card class="panel result-panel" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>AI 分析</h3>
                <p>{{ streaming ? 'DeepSeek 正在流式输出...' : '支持边生成边查看' }}</p>
              </div>
            </div>
          </template>

          <el-empty v-if="!renderedContent && !streaming" description="提交信息后开始分析" :image-size="90" />
          <template v-else>
            <div class="fortune-chat-content">
              <div class="message-list">
                <div v-if="renderedContent" class="message-item assistant">
                  <div class="message-bubble">
                    <div class="message-content markdown-body" v-html="renderMarkdown(renderedContent)"></div>
                  </div>
                </div>

                <div v-if="streaming && !renderedContent" class="message-item assistant">
                  <div class="message-bubble">
                    <div class="message-content typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>

                <div v-if="streaming && renderedContent" class="message-item assistant loading-item">
                  <div class="message-bubble">
                    <div class="message-content typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="result-actions">
              <el-button type="warning" plain @click="fullDialogVisible = true">查看完整分析</el-button>
            </div>
          </template>
        </el-card>

        <el-card class="panel history-panel" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>历史记录</h3>
                <p>点击可回看已落库的分析结果。</p>
              </div>
              <el-button link type="warning" @click="loadHistory">刷新</el-button>
            </div>
          </template>

          <el-empty v-if="historyList.length === 0" description="暂无记录" :image-size="80" />
          <div v-else class="history-list">
            <button
              v-for="item in historyList"
              :key="item.id"
              class="history-item"
              :class="{ active: activeRecordId === item.id }"
              @click="openHistory(item.id)"
            >
              <div class="history-top">
                <strong>{{ item.baZi || `${item.birthDate} ${item.birthTime}` }}</strong>
                <span>{{ item.status }}</span>
              </div>
              <p>{{ item.birthDate }} {{ item.birthTime }} · {{ item.gender }} · {{ item.zodiac }}</p>
              <small>{{ item.question || '整体运势分析' }}</small>
            </button>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog
      v-model="fullDialogVisible"
      title="完整分析"
      width="880px"
      append-to-body
      modal-class="fortune-result-mask"
      class="fortune-result-dialog"
    >
      <div class="dialog-content markdown-body" v-html="renderMarkdown(renderedContent || '暂无内容')"></div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from '@/shared/ui/feedback'
import { loadMarkdownRenderer, renderPlainMarkdown, type MarkdownRenderer } from '@/shared/utils/markdown'
import {
  getBaziFortuneDetail,
  getBaziFortuneHistory,
  streamBaziFortune,
  type BaziFortuneDetail,
  type BaziFortuneHistoryItem,
  type BaziFortuneMeta,
} from '@/api/bazi'

const markdownRenderer = ref<MarkdownRenderer | null>(null)
const streaming = ref(false)
const historyList = ref<BaziFortuneHistoryItem[]>([])
const currentMeta = ref<BaziFortuneMeta | null>(null)
const currentDetail = ref<BaziFortuneDetail | null>(null)
const renderedContent = ref('')
const activeRecordId = ref<number | null>(null)
const fullDialogVisible = ref(false)

const form = reactive({
  birthDateText: '1999-01-11',
  birthTime: '',
  leapMonth: false,
  gender: '男' as '男' | '女',
  question: '',
})

const genderOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
]

const normalizeMarkdown = (content: string) => {
  let text = (content || '').replace(/\r\n/g, '\n')
  text = text.replace(/(^|\n)(#{1,6})([^\s#])/g, '$1$2 $3')
  text = text.replace(/(^|\n)([*+-])([^\s])/g, '$1$2 $3')
  text = text.replace(/(^|\n)(\d+)\.([^\s])/g, '$1$2. $3')
  text = text.replace(/([^\n])(?=\n?#{1,6}\s)/g, '$1\n\n')
  text = text.replace(/(#{1,6}\s[^\n]+)(?=([*+-]\s|\d+\.\s))/g, '$1\n\n')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

const renderMarkdown = (content: string) => {
  const normalized = normalizeMarkdown(content)
  return markdownRenderer.value?.render(normalized) ?? renderPlainMarkdown(normalized)
}

const displayedYearPillar = computed(() => currentMeta.value?.yearPillar || currentDetail.value?.yearPillar || '未生成')
const displayedMonthPillar = computed(() => currentMeta.value?.monthPillar || currentDetail.value?.monthPillar || '未生成')
const displayedDayPillar = computed(() => currentMeta.value?.dayPillar || currentDetail.value?.dayPillar || '未生成')
const displayedHourPillar = computed(() => currentMeta.value?.hourPillar || currentDetail.value?.hourPillar || '未知')
const displayedBaZi = computed(() => currentMeta.value?.baZi || currentDetail.value?.baZi || '未生成')
const displayedZodiac = computed(() => currentMeta.value?.zodiac || currentDetail.value?.zodiac || '未知')
const displayedShiChen = computed(() => currentMeta.value?.shiChen || currentDetail.value?.shiChen || '')
const displayedLunarText = computed(() => currentMeta.value?.lunarText || currentDetail.value?.lunarText || '')
const displayedSolarDate = computed(() => currentMeta.value?.solarDate || currentDetail.value?.solarDate || '')

const loadHistory = async () => {
  historyList.value = await getBaziFortuneHistory()
}

const openHistory = async (id: number) => {
  const detail = await getBaziFortuneDetail(id)
  if (!detail) {
    message.error('加载记录失败')
    return
  }
  activeRecordId.value = id
  currentMeta.value = null
  currentDetail.value = detail
  renderedContent.value = detail.fortuneContent || ''
  applyBirthDate(detail.birthDate)
  form.birthTime = detail.birthTime
  form.leapMonth = Boolean(detail.leapMonth)
  form.gender = detail.gender as '男' | '女'
  form.question = detail.question || ''
}

const submit = async () => {
  const parsedBirthDate = parseBirthDate(form.birthDateText)
  if (!parsedBirthDate || !isValidTime(form.birthTime)) {
    return
  }

  streaming.value = true
  renderedContent.value = ''
  currentMeta.value = null
  currentDetail.value = null

  try {
    await streamBaziFortune(
      {
        birthYear: parsedBirthDate.year,
        birthMonth: parsedBirthDate.month,
        birthDay: parsedBirthDate.day,
        birthTime: form.birthTime,
        leapMonth: form.leapMonth,
        gender: form.gender,
        question: form.question.trim() || undefined,
      },
      {
        onMeta(meta) {
          currentMeta.value = meta
          activeRecordId.value = meta.recordId
          fullDialogVisible.value = false
        },
        onDelta(content) {
          renderedContent.value += content
        },
        async onDone(recordId) {
          await loadHistory()
          const detail = await getBaziFortuneDetail(recordId)
          if (detail) {
            currentDetail.value = detail
            renderedContent.value = detail.fortuneContent || renderedContent.value
          }
        },
        onError(text) {
          message.error(text || '生成失败')
        },
      },
    )
  } catch (error) {
    console.error(error)
    message.error((error as Error).message || '生成失败')
  } finally {
    streaming.value = false
  }
}

onMounted(async () => {
  markdownRenderer.value = await loadMarkdownRenderer({ codeHighlight: true })
  await loadHistory()
  if (historyList.value[0]?.id) {
    await openHistory(historyList.value[0].id)
  }
})

const applyBirthDate = (birthDate: string) => {
  form.birthDateText = birthDate || ''
}

const parseBirthDate = (birthDate: string) => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec((birthDate || '').trim())
  if (!matched) {
    message.warning('农历日期格式应为 YYYY-MM-DD')
    return null
  }
  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 30) {
    message.warning('农历日期范围不正确')
    return null
  }
  return { year, month, day }
}

const isValidTime = (value: string) => {
  const valid = /^([01]\d|2[0-3]):([0-5]\d)$/.test((value || '').trim())
  if (!valid) {
    message.warning('出生时间格式应为 HH:mm')
  }
  return valid
}
</script>

<style scoped lang="scss">
.fortune-page {
  min-height: 100%;
  padding: 14px;
  background:
    radial-gradient(circle at top right, rgba(217, 119, 6, 0.18), transparent 24%),
    linear-gradient(180deg, #f7efe2 0%, #fdfaf4 100%);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff8ec 0%, #fff1d6 100%);
  border: 1px solid rgba(217, 119, 6, 0.18);
  box-shadow: 0 24px 60px rgba(148, 82, 0, 0.08);
}

.eyebrow {
  margin: 0 0 8px;
  color: #b45309;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-card h1 {
  margin: 0;
  color: #4a2b05;
  font-size: 28px;
  font-weight: 700;
}

.hero-desc {
  margin: 8px 0 0;
  color: #7c5c34;
  max-width: 460px;
  line-height: 1.65;
  font-size: 14px;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: flex-end;
  gap: 10px;
}

.hero-pills span {
  padding: 8px 12px;
  border-radius: 999px;
  color: #8a5a13;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(180, 83, 9, 0.12);
  font-size: 12px;
}

.fortune-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
}

.panel {
  border-radius: 20px;
  border: 1px solid rgba(148, 82, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  color: #4a2b05;
}

.panel-header p {
  margin: 4px 0 0;
  color: #8b6f47;
  font-size: 12px;
}

.submit-btn {
  width: 100%;
  height: 40px;
  margin-top: 4px;
}

.field-hint {
  margin-top: 6px;
  color: #8b6f47;
  font-size: 12px;
}

.content-column {
  display: grid;
  gap: 14px;
}

.pillars {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.pillar-card {
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fff7ed 0%, #fffdf8 100%);
  border: 1px solid rgba(217, 119, 6, 0.14);
}

.pillar-card span {
  display: block;
  color: #9a6b23;
  font-size: 12px;
}

.pillar-card strong {
  display: block;
  margin-top: 8px;
  color: #5a3304;
  font-size: 21px;
  letter-spacing: 0.08em;
}

.meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  color: #6f4c1f;
  font-size: 13px;
}

.fortune-chat-content {
  height: 260px;
  overflow-y: auto;
  padding-right: 8px;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.message-list {
  .message-item {
    display: block;
    margin-bottom: 16px;

    &.assistant {
      .message-bubble {
        background: #f4f4f5;
        color: #303133;
      }
    }

    &.loading-item {
      margin-top: -4px;
      margin-bottom: 0;
    }

    .message-bubble {
      width: 100%;
      max-width: 100%;
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

.history-list {
  display: grid;
  gap: 12px;
}

.dialog-content {
  height: 72vh;
  overflow-y: auto;
  padding-right: 10px;
  color: #3f2a11;
  line-height: 1.85;
}

.history-item {
  padding: 14px;
  border: 1px solid #ecd8ba;
  border-radius: 18px;
  background: #fffdf9;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.history-item:hover,
.history-item.active {
  transform: translateY(-2px);
  box-shadow: 0 16px 36px rgba(148, 82, 0, 0.08);
  border-color: #d97706;
}

.history-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #523108;
}

.history-item p,
.history-item small {
  display: block;
  margin: 8px 0 0;
  color: #8b6f47;
}

@media (max-width: 1100px) {
  .fortune-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .fortune-page {
    padding: 14px;
  }

  .hero-card {
    padding: 22px 20px;
  }

  .hero-card h1 {
    font-size: 32px;
  }

  .pillars {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<style lang="scss">
.fortune-result-mask {
  background: rgba(15, 23, 42, 0.6);
}

.fortune-result-dialog .el-dialog {
  border-radius: 24px;
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

  h1, h2, h3, h4, h5, h6 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  h1 { font-size: 1.8em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 6px; }
  h3 { font-size: 1.25em; }
  h4 { font-size: 1.1em; }
  h5 { font-size: 1em; }
  h6 { font-size: 0.9em; color: #6a737d; }

  p {
    margin-top: 0;
    margin-bottom: 12px;
  }

  ul, ol {
    margin-top: 0;
    margin-bottom: 12px;
    padding-left: 2em;
  }

  li {
    margin-bottom: 4px;
  }

  pre {
    background: #282c34;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin: 12px 0;
  }

  pre code {
    background: transparent;
    padding: 0;
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }

  code {
    background: #f6f8fa;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 0.9em;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    color: #e83e8c;
  }

  blockquote {
    border-left: 4px solid #dfe2e5;
    padding: 0 16px;
    margin: 12px 0;
    color: #6a737d;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }

  table th,
  table td {
    border: 1px solid #dfe2e5;
    padding: 8px 13px;
  }

  table th {
    background: #f6f8fa;
    font-weight: 600;
  }

  table tr:nth-child(even) {
    background: #f6f8fa;
  }

  a {
    color: #0366d6;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  hr {
    border: none;
    border-top: 2px solid #eaecef;
    margin: 24px 0;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }
}
</style>
