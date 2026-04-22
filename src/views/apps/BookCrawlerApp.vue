<template>
  <div class="book-crawler-page xbl-app-page xbl-app-page--two-column">
    <el-card class="hero-card">
      <div class="hero-head">
        <div>
          <div class="hero-title-row">
            <el-button class="back-button" text @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回小程序
            </el-button>
            <h2 class="hero-title">
              <el-icon><Search /></el-icon>
              书籍爬虫
            </h2>
          </div>
          <p class="hero-desc">
            输入书籍目录页即可抓取章节，常见小说站会自动识别目录和正文规则，也支持按需手动覆盖高级选择器。
          </p>
        </div>
        <div class="hero-actions">
          <el-button @click="handleCreateTask">新建任务</el-button>
          <el-button type="primary" :loading="saveLoading" @click="handleSave">保存任务</el-button>
          <el-button type="success" :loading="startLoading" @click="handleStart">保存并开始抓取</el-button>
          <el-button
            v-if="selectedTaskId && taskDetail?.task.status === 2"
            type="warning"
            :loading="pauseLoading"
            @click="handlePause"
          >
            暂停抓取
          </el-button>
        </div>
      </div>

      <div class="hero-metrics">
        <div class="metric-card">
          <span class="metric-label">任务数</span>
          <strong>{{ tasks.length }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">当前状态</span>
          <strong>{{ currentTaskStatusText }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">预览章节</span>
          <strong>{{ previewChapters.length }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">保存目录</span>
          <strong class="metric-path">{{ taskForm.saveDirectory || '-' }}</strong>
        </div>
      </div>
    </el-card>

    <div class="workspace">
      <div class="left-panel">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>{{ selectedTaskId ? '编辑任务' : '新建任务' }}</span>
              <el-button type="primary" link :loading="previewLoading" @click="handlePreview">预览目录</el-button>
            </div>
          </template>

          <el-form label-position="top" :model="taskForm" class="config-form">
            <div class="form-grid">
              <el-form-item label="任务名称" required>
                <el-input v-model="taskForm.taskName" maxlength="120" placeholder="例如：起点目录页抓取-凡人修仙传" />
              </el-form-item>

              <el-form-item label="站点名称">
                <el-input v-model="taskForm.siteName" maxlength="120" placeholder="例如：某小说站" />
              </el-form-item>

              <el-form-item label="书籍名称">
                <el-input v-model="taskForm.bookName" maxlength="200" placeholder="可选，不填则使用任务名作为保存目录名" />
              </el-form-item>

              <el-form-item label="保存目录" required>
                <el-input v-model="taskForm.saveDirectory" placeholder="例如：/Users/xubaolin/books" />
              </el-form-item>
            </div>

            <el-form-item label="目录页地址" required>
              <el-input v-model="taskForm.catalogUrl" placeholder="请输入书籍目录页 URL" />
            </el-form-item>

            <div class="advanced-section">
              <el-button text type="primary" class="advanced-toggle" @click="toggleAdvanced">
                {{ showAdvancedOptions ? '收起高级配置' : '高级配置' }}
              </el-button>
              <div class="field-hint">自动识别失败时，再展开手动填写选择器</div>
            </div>

            <el-collapse-transition>
              <div v-show="showAdvancedOptions" class="form-grid form-grid--selectors">
                <el-form-item label="章节链接选择器">
                  <el-input v-model="taskForm.chapterLinkSelector" placeholder="可留空，后端自动识别；仅在自动识别失败时手动填写" />
                  <div class="field-hint">通常留空即可</div>
                </el-form-item>

                <el-form-item label="章节标题选择器">
                  <el-input v-model="taskForm.chapterTitleSelector" placeholder="可留空，默认自动识别章节标题" />
                  <div class="field-hint">通常留空即可</div>
                </el-form-item>

                <el-form-item label="正文选择器">
                  <el-input v-model="taskForm.contentSelector" placeholder="可留空，后端自动识别正文区域" />
                  <div class="field-hint">通常留空即可</div>
                </el-form-item>

                <el-form-item label="正文清洗选择器">
                  <el-input
                    v-model="taskForm.contentRemoveSelectors"
                    placeholder="可留空，后端自动清理广告与无关节点"
                  />
                  <div class="field-hint">通常留空即可</div>
                </el-form-item>
              </div>
            </el-collapse-transition>

            <div class="form-grid form-grid--numbers">
              <el-form-item label="开始章节">
                <el-input-number v-model="taskForm.startChapterNum" :min="1" :step="1" controls-position="right" />
                <div class="field-hint">默认从第 1 章开始</div>
              </el-form-item>

              <el-form-item label="结束章节">
                <el-input-number v-model="taskForm.endChapterNum" :min="1" :step="1" controls-position="right" />
                <div class="field-hint">留空表示抓取到目录最后一章</div>
              </el-form-item>

              <el-form-item label="每章间隔(秒)">
                <el-input-number v-model="taskForm.intervalSeconds" :min="0" :step="1" controls-position="right" />
                <div class="field-hint">0 表示连续抓取，不等待</div>
              </el-form-item>
            </div>
          </el-form>
        </el-card>

        <el-card class="preview-card">
          <template #header>
            <div class="card-header">
              <span>章节预览</span>
              <span class="header-tip" v-if="previewChapters.length">共 {{ previewChapters.length }} 章</span>
            </div>
          </template>

          <el-empty v-if="!previewChapters.length && !previewLoading" description="先填写目录页地址并点击“预览目录”" :image-size="88" />

          <el-table v-else :data="previewChapters" height="360" size="small" v-loading="previewLoading">
            <el-table-column prop="chapterIndex" label="#" width="70" />
            <el-table-column prop="chapterTitle" label="章节标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="chapterUrl" label="章节地址" min-width="280" show-overflow-tooltip />
          </el-table>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="task-list-card">
          <template #header>
            <div class="card-header">
              <span>任务列表</span>
              <el-button type="primary" link :loading="listLoading" @click="loadTasks(selectedTaskId)">刷新</el-button>
            </div>
          </template>

          <div class="task-list" v-loading="listLoading">
            <button
              v-for="task in tasks"
              :key="task.id"
              type="button"
              :class="['task-item', { active: selectedTaskId === task.id }]"
              @click="handleSelectTask(task.id!)"
            >
              <div class="task-item-top">
                <div class="task-name">{{ task.taskName }}</div>
                <el-tag size="small" :type="statusTagType(task.status)">{{ statusText(task.status) }}</el-tag>
              </div>
              <div class="task-item-meta">
                <span>{{ task.siteName || '未填写站点' }}</span>
                <span>{{ formatRange(task.startChapterNum, task.endChapterNum) }}</span>
              </div>
              <div class="task-item-progress">
                <span>成功 {{ task.successChapters || 0 }}</span>
                <span>失败 {{ task.failedChapters || 0 }}</span>
                <span>总计 {{ task.totalChapters || 0 }}</span>
              </div>
              <div class="task-item-foot">
                <span class="truncate">{{ task.lastMessage || '尚未执行' }}</span>
                <span>{{ formatTime(task.updateTime) }}</span>
              </div>
            </button>

            <el-empty v-if="!listLoading && tasks.length === 0" description="还没有保存的爬虫任务" :image-size="80" />
          </div>
        </el-card>

        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>执行详情</span>
              <div class="header-actions" v-if="selectedTaskId">
                <el-button type="primary" link @click="handleSave">保存</el-button>
                <el-button type="success" link :loading="startLoading" @click="handleStart">开始抓取</el-button>
                <el-button
                  v-if="taskDetail?.task.status === 2"
                  type="warning"
                  link
                  :loading="pauseLoading"
                  @click="handlePause"
                >
                  暂停抓取
                </el-button>
                <el-button type="danger" link @click="handleDelete">删除任务</el-button>
              </div>
            </div>
          </template>

          <el-empty v-if="!selectedTaskId" description="从右上角新建任务，或选择已有任务" :image-size="92" />

          <template v-else>
            <div class="detail-summary" v-loading="detailLoading">
              <div class="summary-row">
                <div class="summary-item">
                  <span class="summary-label">书籍</span>
                  <strong>{{ taskDetail?.task.bookName || taskForm.bookName || taskForm.taskName || '-' }}</strong>
                </div>
                <div class="summary-item">
                  <span class="summary-label">状态</span>
                  <el-tag :type="statusTagType(taskDetail?.task.status)">{{ statusText(taskDetail?.task.status) }}</el-tag>
                </div>
                <div class="summary-item">
                  <span class="summary-label">开始时间</span>
                  <strong>{{ formatTime(taskDetail?.task.lastStartTime) }}</strong>
                </div>
                <div class="summary-item">
                  <span class="summary-label">结束时间</span>
                  <strong>{{ formatTime(taskDetail?.task.lastFinishTime) }}</strong>
                </div>
              </div>

              <div class="summary-message">{{ taskDetail?.task.lastMessage || '任务已保存，等待执行' }}</div>
            </div>

            <el-table
              v-if="taskDetail?.chapters?.length"
              :data="taskDetail.chapters"
              height="420"
              size="small"
              class="chapter-table"
            >
              <el-table-column prop="chapterIndex" label="#" width="70" />
              <el-table-column prop="chapterTitle" label="章节标题" min-width="180" show-overflow-tooltip />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="chapterStatusTagType(row.crawlStatus)">{{ chapterStatusText(row.crawlStatus) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="contentLength" label="字数" width="90" />
              <el-table-column prop="savePath" label="保存路径" min-width="220" show-overflow-tooltip />
              <el-table-column prop="errorMessage" label="错误信息" min-width="180" show-overflow-tooltip />
            </el-table>

            <el-empty
              v-else-if="!detailLoading"
              description="任务还没有执行记录，点击“开始抓取”后这里会显示每章保存结果"
              :image-size="90"
            />
          </template>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { confirm } from '@/shared/ui/confirm'
import { message } from '@/shared/ui/feedback'
import {
  deleteBookCrawlerTask,
  getBookCrawlerTaskDetail,
  getBookCrawlerTaskList,
  pauseBookCrawlerTask,
  previewBookCrawlerChapters,
  saveBookCrawlerTask,
  startBookCrawlerTask,
  type BookCrawlerPreviewChapter,
  type BookCrawlerTask,
  type BookCrawlerTaskDetail,
  type BookCrawlerTaskSavePayload
} from '@/api/bookCrawler'

type TaskFormState = BookCrawlerTaskSavePayload

const router = useRouter()

const createDefaultTaskForm = (): TaskFormState => ({
  taskName: '',
  siteName: '',
  bookName: '',
  catalogUrl: '',
  chapterLinkSelector: '',
  chapterTitleSelector: '',
  contentSelector: '',
  contentRemoveSelectors: '',
  startChapterNum: 1,
  endChapterNum: null,
  intervalSeconds: 1,
  saveDirectory: ''
})

const taskForm = reactive<TaskFormState>(createDefaultTaskForm())
const tasks = ref<BookCrawlerTask[]>([])
const previewChapters = ref<BookCrawlerPreviewChapter[]>([])
const taskDetail = ref<BookCrawlerTaskDetail | null>(null)
const selectedTaskId = ref<number | null>(null)
const showAdvancedOptions = ref(false)

const listLoading = ref(false)
const detailLoading = ref(false)
const previewLoading = ref(false)
const saveLoading = ref(false)
const startLoading = ref(false)
const pauseLoading = ref(false)
const polling = ref(false)

let pollTimer: number | null = null

const currentTaskStatusText = computed(() => statusText(taskDetail.value?.task.status))

const goBack = () => {
  router.push('/index/miniapp')
}

const clearPollingTimer = () => {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

const syncPolling = () => {
  const shouldPoll = selectedTaskId.value !== null && taskDetail.value?.task.status === 2
  if (!shouldPoll) {
    clearPollingTimer()
    return
  }

  if (pollTimer !== null) {
    return
  }

  pollTimer = window.setInterval(async () => {
    if (polling.value || selectedTaskId.value === null) {
      return
    }
    polling.value = true
    try {
      await loadTasks(selectedTaskId.value)
      await loadTaskDetail(selectedTaskId.value, false)
    } finally {
      polling.value = false
    }
  }, 3000)
}

const applyTaskToForm = (task: BookCrawlerTask) => {
  taskForm.taskName = task.taskName || ''
  taskForm.siteName = task.siteName || ''
  taskForm.bookName = task.bookName || ''
  taskForm.catalogUrl = task.catalogUrl || ''
  taskForm.chapterLinkSelector = task.chapterLinkSelector || ''
  taskForm.chapterTitleSelector = task.chapterTitleSelector || ''
  taskForm.contentSelector = task.contentSelector || ''
  taskForm.contentRemoveSelectors = task.contentRemoveSelectors || ''
  taskForm.startChapterNum = task.startChapterNum || 1
  taskForm.endChapterNum = task.endChapterNum ?? null
  taskForm.intervalSeconds = task.intervalSeconds ?? 1
  taskForm.saveDirectory = task.saveDirectory || ''
  showAdvancedOptions.value = hasAdvancedConfig()
}

const resetForm = () => {
  Object.assign(taskForm, createDefaultTaskForm())
  showAdvancedOptions.value = false
}

const hasAdvancedConfig = () => {
  return Boolean(
    taskForm.chapterLinkSelector.trim() ||
    taskForm.chapterTitleSelector.trim() ||
    taskForm.contentSelector.trim() ||
    taskForm.contentRemoveSelectors.trim()
  )
}

const toggleAdvanced = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value
}

const normalizePayload = (): BookCrawlerTaskSavePayload => ({
  id: selectedTaskId.value ?? undefined,
  taskName: taskForm.taskName.trim(),
  siteName: taskForm.siteName.trim() || undefined,
  bookName: taskForm.bookName.trim() || undefined,
  catalogUrl: taskForm.catalogUrl.trim(),
  chapterLinkSelector: taskForm.chapterLinkSelector.trim() || undefined,
  chapterTitleSelector: taskForm.chapterTitleSelector.trim() || undefined,
  contentSelector: taskForm.contentSelector.trim() || undefined,
  contentRemoveSelectors: taskForm.contentRemoveSelectors.trim() || undefined,
  startChapterNum: taskForm.startChapterNum || 1,
  endChapterNum: taskForm.endChapterNum ?? null,
  intervalSeconds: taskForm.intervalSeconds ?? 1,
  saveDirectory: taskForm.saveDirectory.trim()
})

const validateForm = () => {
  const payload = normalizePayload()
  if (!payload.taskName) {
    message.warning('请填写任务名称')
    return false
  }
  if (!payload.catalogUrl) {
    message.warning('请填写目录页地址')
    return false
  }
  if (!payload.saveDirectory) {
    message.warning('请填写保存目录')
    return false
  }
  if (payload.endChapterNum !== null && payload.endChapterNum < payload.startChapterNum) {
    message.warning('结束章节不能小于开始章节')
    return false
  }
  return true
}

const loadTasks = async (preferredTaskId?: number | null) => {
  listLoading.value = true
  try {
    const list = await getBookCrawlerTaskList()
    tasks.value = list

    if (preferredTaskId && list.some((item) => item.id === preferredTaskId)) {
      selectedTaskId.value = preferredTaskId
      return
    }

    if (selectedTaskId.value && list.some((item) => item.id === selectedTaskId.value)) {
      return
    }

    if (list.length > 0) {
      selectedTaskId.value = list[0].id || null
      await loadTaskDetail(selectedTaskId.value, true)
    } else if (!preferredTaskId) {
      selectedTaskId.value = null
      taskDetail.value = null
      clearPollingTimer()
    }
  } finally {
    listLoading.value = false
  }
}

const loadTaskDetail = async (taskId: number | null, syncForm = true) => {
  if (!taskId) {
    taskDetail.value = null
    clearPollingTimer()
    return
  }

  detailLoading.value = true
  try {
    const detail = await getBookCrawlerTaskDetail(taskId)
    if (!detail) {
      return
    }
    taskDetail.value = detail
    if (syncForm) {
      applyTaskToForm(detail.task)
      previewChapters.value = []
    }
  } finally {
    detailLoading.value = false
    syncPolling()
  }
}

const handleSelectTask = async (taskId: number) => {
  selectedTaskId.value = taskId
  await loadTaskDetail(taskId, true)
}

const handleCreateTask = () => {
  selectedTaskId.value = null
  taskDetail.value = null
  previewChapters.value = []
  clearPollingTimer()
  resetForm()
}

const handlePreview = async () => {
  if (!taskForm.catalogUrl.trim()) {
    message.warning('请先填写目录页地址')
    return
  }

  previewLoading.value = true
  try {
    previewChapters.value = await previewBookCrawlerChapters({
      catalogUrl: taskForm.catalogUrl.trim(),
      chapterLinkSelector: taskForm.chapterLinkSelector.trim() || undefined,
      chapterTitleSelector: taskForm.chapterTitleSelector.trim() || undefined,
      contentSelector: taskForm.contentSelector.trim() || undefined,
      contentRemoveSelectors: taskForm.contentRemoveSelectors.trim() || undefined
    })
  } finally {
    previewLoading.value = false
  }
}

const saveCurrentTask = async () => {
  if (!validateForm()) {
    return null
  }
  saveLoading.value = true
  try {
    const taskId = await saveBookCrawlerTask(normalizePayload())
    if (taskId) {
      selectedTaskId.value = taskId
      await loadTasks(taskId)
      await loadTaskDetail(taskId, true)
    }
    return taskId
  } finally {
    saveLoading.value = false
  }
}

const handleSave = async () => {
  await saveCurrentTask()
}

const handleStart = async () => {
  const taskId = await saveCurrentTask()
  if (!taskId) {
    return
  }

  const confirmed = await confirm({
    title: '开始抓取',
    message: '确认按照当前任务配置开始抓取吗？执行中可在右侧查看进度。',
    confirmText: '开始'
  })
  if (!confirmed) {
    return
  }

  startLoading.value = true
  try {
    const success = await startBookCrawlerTask(taskId)
    if (success) {
      await loadTasks(taskId)
      await loadTaskDetail(taskId, false)
    }
  } finally {
    startLoading.value = false
  }
}

const handleDelete = async () => {
  if (!selectedTaskId.value) {
    return
  }
  const confirmed = await confirm({
    title: '删除任务',
    message: '删除后不会清理已经保存到磁盘的文件，是否继续？',
    confirmText: '删除'
  })
  if (!confirmed) {
    return
  }

  const success = await deleteBookCrawlerTask(selectedTaskId.value)
  if (!success) {
    return
  }

  const nextId = tasks.value.find((item) => item.id !== selectedTaskId.value)?.id ?? null
  selectedTaskId.value = nextId
  previewChapters.value = []
  taskDetail.value = null
  await loadTasks(nextId)
  if (nextId) {
    await loadTaskDetail(nextId, true)
  } else {
    handleCreateTask()
  }
}

const handlePause = async () => {
  if (!selectedTaskId.value) {
    return
  }

  const confirmed = await confirm({
    title: '暂停抓取',
    message: '暂停会在当前章节处理完成后停止，后续重新开始时会按当前任务配置重新抓取本次范围，是否继续？',
    confirmText: '暂停'
  })
  if (!confirmed) {
    return
  }

  pauseLoading.value = true
  try {
    const success = await pauseBookCrawlerTask(selectedTaskId.value)
    if (success) {
      await loadTasks(selectedTaskId.value)
      await loadTaskDetail(selectedTaskId.value, false)
    }
  } finally {
    pauseLoading.value = false
  }
}

const statusText = (status?: number | null) => {
  if (status === 2) return '执行中'
  if (status === 3) return '成功'
  if (status === 4) return '部分失败'
  if (status === 5) return '失败'
  if (status === 6) return '已暂停'
  return '待执行'
}

const statusTagType = (status?: number | null) => {
  if (status === 2) return 'warning'
  if (status === 3) return 'success'
  if (status === 4) return 'info'
  if (status === 5) return 'danger'
  if (status === 6) return 'info'
  return ''
}

const chapterStatusText = (status?: number | null) => {
  if (status === 2) return '成功'
  if (status === 3) return '失败'
  return '待抓取'
}

const chapterStatusTagType = (status?: number | null) => {
  if (status === 2) return 'success'
  if (status === 3) return 'danger'
  return 'info'
}

const formatTime = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}

const formatRange = (start?: number, end?: number | null) => {
  const safeStart = start || 1
  return end ? `第 ${safeStart} - ${end} 章` : `第 ${safeStart} 章起`
}

onMounted(async () => {
  await loadTasks()
})

onBeforeUnmount(() => {
  clearPollingTimer()
})
</script>

<style scoped lang="scss">
.book-crawler-page {
  min-height: 100%;
  padding: 20px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 28%),
    linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%);
}

.hero-card,
.config-card,
.preview-card,
.task-list-card,
.detail-card {
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.hero-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.back-button {
  padding-left: 0;
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 28px;
  color: #0f172a;
}

.hero-desc {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.metric-card {
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.82));
  border: 1px solid rgba(37, 99, 235, 0.12);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  font-size: 13px;
  color: #64748b;
}

.metric-card strong {
  color: #0f172a;
  font-size: 20px;
}

.metric-path {
  font-size: 14px !important;
  word-break: break-all;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  gap: 18px;
  margin-top: 18px;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-header,
.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.advanced-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 8px;
}

.advanced-toggle {
  padding-left: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-grid--numbers {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field-hint,
.header-tip {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 220px;
  max-height: 360px;
  overflow: auto;
}

.task-item {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-item:hover,
.task-item.active {
  border-color: rgba(37, 99, 235, 0.45);
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}

.task-item-top,
.task-item-meta,
.task-item-progress,
.task-item-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.task-item-top {
  align-items: center;
  margin-bottom: 10px;
}

.task-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.task-item-meta,
.task-item-progress,
.task-item-foot {
  color: #64748b;
  font-size: 13px;
  margin-top: 6px;
}

.truncate {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-summary {
  margin-bottom: 14px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  color: #64748b;
  font-size: 12px;
}

.summary-item strong {
  color: #0f172a;
  font-size: 15px;
  word-break: break-all;
}

.summary-message {
  margin-top: 14px;
  color: #334155;
  line-height: 1.7;
}

@media (max-width: 960px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .hero-metrics,
  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .book-crawler-page {
    padding: 14px;
  }

  .hero-head,
  .hero-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-metrics,
  .form-grid,
  .form-grid--numbers,
  .summary-row {
    grid-template-columns: 1fr;
  }
}
</style>
