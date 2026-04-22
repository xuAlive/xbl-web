<template>
  <div class="medical-knowledge-page xbl-app-page xbl-app-page--three-column xbl-app-page--medical">
    <el-card class="hero-card">
      <div class="hero-top">
        <div>
          <div class="hero-title-row">
            <el-button class="back-button" text @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回小程序
            </el-button>
            <h2 class="hero-title">
              <el-icon><Reading /></el-icon>
              医疗知识库
            </h2>
          </div>
          <p class="hero-desc">
            支持读取本地路径或上传医疗书籍，自动完成清洗、切块、AI 提取，并以知识条目和原文证据的方式展示。
          </p>
        </div>
        <div class="hero-actions">
          <el-button :loading="refreshing" @click="refreshAll">刷新数据</el-button>
        </div>
      </div>

      <div class="hero-metrics">
        <div class="metric-card">
          <span class="metric-label">来源书籍</span>
          <strong>{{ sources.length }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">处理中</span>
          <strong>{{ runningSourceCount }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">知识条目</span>
          <strong>{{ totalKnowledgeCount }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">当前来源</span>
          <strong class="metric-path">{{ sourceDetail?.source.sourceName || '未选择' }}</strong>
        </div>
      </div>
    </el-card>

    <div class="workspace">
      <div class="left-panel">
        <el-card class="import-card">
          <template #header>
            <div class="card-header">
              <span>导入书籍</span>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="服务器本地路径导入">
              <el-input
                v-model="localPath"
                placeholder="请输入服务器文件或目录绝对路径，例如 /tmp/medical-books"
                clearable
              />
              <div class="field-hint">支持目录批量导入，后端会自动识别 pdf / txt / docx</div>
            </el-form-item>
            <el-button type="primary" :loading="importingLocal" @click="handleImportLocal">开始本地导入</el-button>
          </el-form>

          <el-divider />

          <div class="upload-section">
            <div class="upload-title">上传文件导入</div>
            <div class="field-hint">线上环境可上传单个书籍文件，服务器会暂存后异步提取</div>
            <input ref="uploadInputRef" class="hidden-input" type="file" accept=".pdf,.txt,.docx" @change="handleFileChange" />
            <div class="upload-actions">
              <el-button @click="triggerUpload">选择文件</el-button>
              <span class="upload-file-name">{{ uploadFileName || '未选择文件' }}</span>
            </div>
            <el-button type="success" :loading="uploading" :disabled="!selectedFile" @click="handleUpload">
              上传并提取
            </el-button>
          </div>
        </el-card>

        <el-card class="source-card">
          <template #header>
            <div class="card-header">
              <span>来源书籍</span>
              <el-button type="primary" link :loading="sourceLoading" @click="loadSources">刷新</el-button>
            </div>
          </template>

          <div class="source-list" v-loading="sourceLoading">
            <button
              v-for="source in sources"
              :key="source.id"
              type="button"
              :class="['source-item', { active: selectedSourceId === source.id }]"
              @click="handleSelectSource(source.id)"
            >
              <div class="source-item-top">
                <div class="source-name">{{ source.sourceName }}</div>
                <el-tag size="small" :type="statusTagType(source)">{{ statusText(source) }}</el-tag>
              </div>
              <div class="source-item-meta">
                <span>{{ source.fileFormat.toUpperCase() }}</span>
                <span>{{ formatSourceType(source.sourceType) }}</span>
                <span>{{ formatTime(source.updateTime) }}</span>
              </div>
              <div class="source-item-progress">
                <span>章节 {{ source.chapterCount || 0 }}</span>
                <span>分块 {{ source.chunkCount || 0 }}</span>
                <span>知识 {{ source.knowledgeCount || 0 }}</span>
              </div>
              <div class="source-item-error" v-if="source.errorMessage">{{ source.errorMessage }}</div>
            </button>

            <el-empty v-if="!sourceLoading && sources.length === 0" description="还没有导入任何书籍" :image-size="80" />
          </div>
        </el-card>
      </div>

      <div class="middle-panel">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>来源详情</span>
              <div class="header-actions" v-if="selectedSourceId">
                <el-button type="primary" link :loading="detailLoading" @click="loadSourceDetail(selectedSourceId)">刷新详情</el-button>
                <el-button type="warning" link :loading="reextracting" @click="handleReextract">重新提取</el-button>
              </div>
            </div>
          </template>

          <el-empty v-if="!selectedSourceId" description="选择左侧来源书籍后查看处理状态与最近提取结果" :image-size="86" />

          <template v-else>
            <div class="source-summary" v-loading="detailLoading">
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">文件名</span>
                  <strong>{{ sourceDetail?.source.sourceName || '-' }}</strong>
                </div>
                <div class="summary-item">
                  <span class="summary-label">解析状态</span>
                  <el-tag :type="parseStatusTagType(sourceDetail?.source.parseStatus)">{{ parseStatusText(sourceDetail?.source.parseStatus) }}</el-tag>
                </div>
                <div class="summary-item">
                  <span class="summary-label">提取状态</span>
                  <el-tag :type="extractStatusTagType(sourceDetail?.source.extractStatus)">{{ extractStatusText(sourceDetail?.source.extractStatus) }}</el-tag>
                </div>
                <div class="summary-item">
                  <span class="summary-label">存储路径</span>
                  <strong class="summary-path">{{ sourceDetail?.source.storagePath || '-' }}</strong>
                </div>
              </div>
              <div class="summary-message">
                {{ sourceDetail?.source.errorMessage || latestTaskMessage || '等待处理' }}
              </div>
            </div>

            <div class="task-timeline">
              <div class="section-title">任务记录</div>
              <el-timeline>
                <el-timeline-item
                  v-for="task in sourceDetail?.tasks || []"
                  :key="task.id"
                  :timestamp="formatTime(task.createTime)"
                  :type="timelineType(task.taskStatus)"
                >
                  <div class="timeline-content">
                    <div class="timeline-title">{{ taskTypeText(task.taskType) }} · {{ taskStatusText(task.taskStatus) }}</div>
                    <div class="timeline-desc">{{ task.resultMessage || '暂无结果消息' }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <div class="latest-items">
              <div class="section-title">最近生成的知识</div>
              <div class="section-subtitle">仅展示当前来源最新生成的 2 条知识</div>
              <el-empty v-if="!(sourceDetail?.latestItems || []).length" description="当前来源暂未生成知识条目" :image-size="76" />
              <div v-else class="latest-item-list">
                <button
                  v-for="item in sourceDetail?.latestItems || []"
                  :key="item.id"
                  type="button"
                  class="latest-item"
                  @click="handleOpenItemDetail(item.id)"
                >
                  <div class="latest-item-title">{{ item.title }}</div>
                  <div class="latest-item-meta">
                    <span>{{ item.itemType }}</span>
                    <span>{{ item.department || '综合' }}</span>
                    <span>{{ formatConfidence(item.confidenceScore) }}</span>
                  </div>
                  <div class="latest-item-summary">{{ item.summary || item.content }}</div>
                </button>
              </div>
            </div>
          </template>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="knowledge-card">
          <template #header>
            <div class="card-header">
              <span>知识条目</span>
              <span class="header-tip">服务端分页查询</span>
            </div>
          </template>

          <div class="filters">
            <el-input v-model="filters.keyword" clearable placeholder="搜索标题、关键词、摘要" @keyup.enter="handleSearch" />
            <el-select v-model="filters.itemType" clearable placeholder="知识类型">
              <el-option v-for="type in itemTypes" :key="type" :label="type" :value="type" />
            </el-select>
            <el-input v-model="filters.department" clearable placeholder="科室，如 心内科" @keyup.enter="handleSearch" />
            <div class="filter-actions">
              <el-button type="primary" :loading="itemLoading" @click="handleSearch">查询</el-button>
              <el-button @click="handleResetFilters">重置</el-button>
            </div>
          </div>

          <div class="knowledge-list" v-loading="itemLoading">
            <el-empty v-if="!itemLoading && itemPage.list.length === 0" description="没有查询到知识条目" :image-size="88" />
            <button
              v-for="item in itemPage.list"
              :key="item.id"
              type="button"
              class="knowledge-item"
              @click="handleOpenItemDetail(item.id)"
            >
              <div class="knowledge-item-top">
                <div class="knowledge-item-title">{{ item.title }}</div>
                <div class="knowledge-item-actions" @click.stop>
                  <el-button type="primary" link @click="handleOpenItemDetail(item.id)">详情</el-button>
                  <el-button type="danger" link @click="handleDeleteItem(item.id)">删除</el-button>
                </div>
              </div>

              <div class="knowledge-item-meta">
                <el-tag size="small">{{ item.itemType }}</el-tag>
                <el-tag size="small" type="success">{{ item.department || '综合' }}</el-tag>
                <span>置信度 {{ formatConfidence(item.confidenceScore) }}</span>
                <span>{{ formatTime(item.updateTime) }}</span>
              </div>

              <div class="knowledge-item-keywords">关键词：{{ item.keywords || '无' }}</div>
              <div class="knowledge-item-summary">{{ item.summary || item.content }}</div>
            </button>
          </div>

          <div class="pagination-row">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="itemPage.total"
              :page-size="filters.pageSize"
              :current-page="filters.pageNum"
              :page-sizes="[6, 10, 20, 30]"
              @current-change="handlePageChange"
              @size-change="handlePageSizeChange"
            />
          </div>
        </el-card>
      </div>
    </div>

    <el-drawer v-model="detailDrawerVisible" title="知识详情" size="48%">
      <el-empty v-if="!itemDetail" description="未加载到知识详情" :image-size="90" />

      <template v-else>
        <div class="drawer-section">
          <div class="drawer-title">{{ itemDetail.item.title }}</div>
          <div class="drawer-meta">
            <el-tag>{{ itemDetail.item.itemType }}</el-tag>
            <el-tag type="success">{{ itemDetail.item.department || '综合' }}</el-tag>
            <el-tag type="info">{{ formatConfidence(itemDetail.item.confidenceScore) }}</el-tag>
          </div>
          <div class="drawer-keywords">关键词：{{ itemDetail.item.keywords || '无' }}</div>
        </div>

        <div class="drawer-section">
          <div class="section-title">知识摘要</div>
          <div class="drawer-text">{{ itemDetail.item.summary || '暂无摘要' }}</div>
        </div>

        <div class="drawer-section">
          <div class="section-title">知识正文</div>
          <div class="drawer-text drawer-text--content">{{ itemDetail.item.content }}</div>
        </div>

        <div class="drawer-section">
          <div class="section-title">来源信息</div>
          <div class="drawer-source-grid">
            <div>来源书籍：{{ itemDetail.source.sourceName }}</div>
            <div>文件格式：{{ itemDetail.source.fileFormat.toUpperCase() }}</div>
            <div>章节数：{{ itemDetail.source.chapterCount || 0 }}</div>
            <div>知识条数：{{ itemDetail.source.knowledgeCount || 0 }}</div>
          </div>
        </div>

        <div class="drawer-section">
          <div class="section-title">原文证据</div>
          <el-collapse v-if="itemDetail.references.length">
            <el-collapse-item
              v-for="reference in itemDetail.references"
              :key="reference.refId"
              :title="referenceTitle(reference)"
              :name="String(reference.refId)"
            >
              <div class="evidence-quote">{{ reference.quoteText || '无引用片段' }}</div>
              <div class="evidence-content">{{ reference.cleanContent || '无原文上下文' }}</div>
            </el-collapse-item>
          </el-collapse>
          <el-empty v-else description="该条目暂未关联原文证据" :image-size="70" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Reading } from '@element-plus/icons-vue'
import { confirm } from '@/shared/ui/confirm'
import type {
  MedicalKnowledgeEvidence,
  MedicalKnowledgeItem,
  MedicalKnowledgeItemDetail,
  MedicalKnowledgePage,
  MedicalKnowledgeSource,
  MedicalKnowledgeSourceDetail,
} from '@/api/medicalKnowledge'
import {
  deleteMedicalKnowledgeItem,
  getMedicalKnowledgeItemDetail,
  getMedicalKnowledgeItemPage,
  getMedicalKnowledgeItemTypes,
  getMedicalKnowledgeSourceDetail,
  getMedicalKnowledgeSourceList,
  importMedicalKnowledgeByLocalPath,
  reextractMedicalKnowledgeSource,
  uploadMedicalKnowledgeFile,
} from '@/api/medicalKnowledge'

const router = useRouter()
const uploadInputRef = ref<HTMLInputElement>()
const localPath = ref('')
const selectedFile = ref<File | null>(null)
const uploadFileName = ref('')
const selectedSourceId = ref<number | null>(null)
const detailDrawerVisible = ref(false)
const itemDetail = ref<MedicalKnowledgeItemDetail | null>(null)

const importingLocal = ref(false)
const uploading = ref(false)
const sourceLoading = ref(false)
const detailLoading = ref(false)
const itemLoading = ref(false)
const refreshing = ref(false)
const reextracting = ref(false)

const sources = ref<MedicalKnowledgeSource[]>([])
const sourceDetail = ref<MedicalKnowledgeSourceDetail | null>(null)
const itemPage = ref<MedicalKnowledgePage<MedicalKnowledgeItem>>({ total: 0, list: [] })
const itemTypes = ref<string[]>([])

const filters = ref({
  sourceId: undefined as number | undefined,
  keyword: '',
  itemType: '',
  department: '',
  pageNum: 1,
  pageSize: 10,
})

const runningSourceCount = computed(() =>
  sources.value.filter((item) => item.parseStatus === 2 || item.extractStatus === 2).length,
)

const totalKnowledgeCount = computed(() =>
  sources.value.reduce((sum, item) => sum + (item.knowledgeCount || 0), 0),
)

const latestTaskMessage = computed(() => sourceDetail.value?.tasks?.[0]?.resultMessage || '')

const goBack = () => {
  router.push('/index/miniapp')
}

const formatTime = (value?: string) => {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}

const formatSourceType = (sourceType?: number) => {
  if (sourceType === 1) {
    return '本地路径'
  }
  if (sourceType === 2) {
    return '上传文件'
  }
  return '未知来源'
}

const parseStatusText = (status?: number) => {
  if (status === 2) {
    return '解析中'
  }
  if (status === 3) {
    return '解析完成'
  }
  if (status === 4) {
    return '解析失败'
  }
  return '待解析'
}

const extractStatusText = (status?: number) => {
  if (status === 2) {
    return '提取中'
  }
  if (status === 3) {
    return '提取完成'
  }
  if (status === 4) {
    return '提取失败'
  }
  return '待提取'
}

const statusText = (source: MedicalKnowledgeSource) => {
  if (source.extractStatus === 3) {
    return '已完成'
  }
  if (source.parseStatus === 4 || source.extractStatus === 4) {
    return '失败'
  }
  if (source.parseStatus === 2 || source.extractStatus === 2) {
    return '处理中'
  }
  return '待执行'
}

const statusTagType = (source: MedicalKnowledgeSource) => {
  if (source.extractStatus === 3) {
    return 'success'
  }
  if (source.parseStatus === 4 || source.extractStatus === 4) {
    return 'danger'
  }
  if (source.parseStatus === 2 || source.extractStatus === 2) {
    return 'warning'
  }
  return 'info'
}

const parseStatusTagType = (status?: number) => {
  if (status === 3) {
    return 'success'
  }
  if (status === 4) {
    return 'danger'
  }
  if (status === 2) {
    return 'warning'
  }
  return 'info'
}

const extractStatusTagType = (status?: number) => {
  if (status === 3) {
    return 'success'
  }
  if (status === 4) {
    return 'danger'
  }
  if (status === 2) {
    return 'warning'
  }
  return 'info'
}

const taskTypeText = (taskType?: number) => {
  if (taskType === 2) {
    return '重新提取'
  }
  return '导入提取'
}

const taskStatusText = (taskStatus?: number) => {
  if (taskStatus === 2) {
    return '执行中'
  }
  if (taskStatus === 3) {
    return '成功'
  }
  if (taskStatus === 4) {
    return '失败'
  }
  return '待执行'
}

const timelineType = (taskStatus?: number) => {
  if (taskStatus === 3) {
    return 'success'
  }
  if (taskStatus === 4) {
    return 'danger'
  }
  if (taskStatus === 2) {
    return 'warning'
  }
  return 'info'
}

const formatConfidence = (value?: number) => {
  if (value === undefined || value === null) {
    return '-'
  }
  return `${Math.round(value * 100)}%`
}

const referenceTitle = (reference: MedicalKnowledgeEvidence) => {
  const chapter = reference.chapterTitle || `第 ${reference.chapterNo || '-'} 节`
  if (reference.pageFrom && reference.pageTo) {
    return `${chapter} · 页码 ${reference.pageFrom}-${reference.pageTo}`
  }
  return chapter
}

const loadSources = async () => {
  sourceLoading.value = true
  try {
    sources.value = await getMedicalKnowledgeSourceList()
    if (!selectedSourceId.value && sources.value.length) {
      selectedSourceId.value = sources.value[0].id
    }
  } finally {
    sourceLoading.value = false
  }
}

const loadSourceDetail = async (sourceId: number) => {
  detailLoading.value = true
  try {
    sourceDetail.value = await getMedicalKnowledgeSourceDetail(sourceId)
  } finally {
    detailLoading.value = false
  }
}

const loadItems = async () => {
  itemLoading.value = true
  try {
    itemPage.value = await getMedicalKnowledgeItemPage({
      sourceId: filters.value.sourceId,
      keyword: filters.value.keyword || undefined,
      itemType: filters.value.itemType || undefined,
      department: filters.value.department || undefined,
      pageNum: filters.value.pageNum,
      pageSize: filters.value.pageSize,
    })
  } finally {
    itemLoading.value = false
  }
}

const loadItemTypes = async () => {
  itemTypes.value = await getMedicalKnowledgeItemTypes(filters.value.sourceId)
}

const refreshAll = async () => {
  refreshing.value = true
  try {
    await loadSources()
    if (selectedSourceId.value) {
      await loadSourceDetail(selectedSourceId.value)
    }
    await loadItemTypes()
    await loadItems()
  } finally {
    refreshing.value = false
  }
}

const handleSelectSource = async (sourceId: number) => {
  selectedSourceId.value = sourceId
  filters.value.sourceId = sourceId
  filters.value.pageNum = 1
  await loadSourceDetail(sourceId)
  await loadItemTypes()
  await loadItems()
}

const handleSearch = async () => {
  filters.value.pageNum = 1
  await loadItems()
}

const handleResetFilters = async () => {
  filters.value.keyword = ''
  filters.value.itemType = ''
  filters.value.department = ''
  filters.value.pageNum = 1
  filters.value.sourceId = selectedSourceId.value || undefined
  await loadItems()
}

const handlePageChange = async (pageNum: number) => {
  filters.value.pageNum = pageNum
  await loadItems()
}

const handlePageSizeChange = async (pageSize: number) => {
  filters.value.pageSize = pageSize
  filters.value.pageNum = 1
  await loadItems()
}

const handleImportLocal = async () => {
  if (!localPath.value.trim()) {
    return
  }
  importingLocal.value = true
  try {
    const result = await importMedicalKnowledgeByLocalPath(localPath.value.trim())
    if (result) {
      localPath.value = ''
      await refreshAll()
      if (result.sourceIds.length) {
        await handleSelectSource(result.sourceIds[0])
      }
    }
  } finally {
    importingLocal.value = false
  }
}

const triggerUpload = () => {
  uploadInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  selectedFile.value = file
  uploadFileName.value = file?.name || ''
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    return
  }
  uploading.value = true
  try {
    const result = await uploadMedicalKnowledgeFile(selectedFile.value)
    if (result) {
      selectedFile.value = null
      uploadFileName.value = ''
      if (uploadInputRef.value) {
        uploadInputRef.value.value = ''
      }
      await refreshAll()
      if (result.sourceIds.length) {
        await handleSelectSource(result.sourceIds[0])
      }
    }
  } finally {
    uploading.value = false
  }
}

const handleReextract = async () => {
  if (!selectedSourceId.value) {
    return
  }
  const confirmed = await confirm({
    title: '重新提取',
    message: '将清空当前来源已生成的知识条目并重新执行解析提取，是否继续？',
    confirmText: '继续',
    cancelText: '取消',
  })
  if (!confirmed) {
    return
  }
  reextracting.value = true
  try {
    const success = await reextractMedicalKnowledgeSource(selectedSourceId.value)
    if (success) {
      await refreshAll()
      await loadSourceDetail(selectedSourceId.value)
    }
  } finally {
    reextracting.value = false
  }
}

const handleOpenItemDetail = async (itemId: number) => {
  const detail = await getMedicalKnowledgeItemDetail(itemId)
  if (!detail) {
    return
  }
  itemDetail.value = detail
  detailDrawerVisible.value = true
}

const handleDeleteItem = async (itemId: number) => {
  const confirmed = await confirm({
    title: '删除知识条目',
    message: '删除后当前条目将不再显示，是否继续？',
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!confirmed) {
    return
  }
  const success = await deleteMedicalKnowledgeItem(itemId)
  if (!success) {
    return
  }
  if (itemDetail.value?.item.id === itemId) {
    detailDrawerVisible.value = false
    itemDetail.value = null
  }
  await refreshAll()
}

onMounted(async () => {
  await loadSources()
  if (selectedSourceId.value) {
    filters.value.sourceId = selectedSourceId.value
    await loadSourceDetail(selectedSourceId.value)
  }
  await loadItemTypes()
  await loadItems()
})
</script>

<style scoped lang="sass">
.medical-knowledge-page
  padding: 20px
  min-height: 100%
  background: linear-gradient(180deg, #f4fbf9 0%, #eef5f7 40%, #f7fafc 100%)

  .hero-card
    margin-bottom: 20px
    border: none
    background: linear-gradient(135deg, rgba(15, 118, 110, 0.94), rgba(8, 145, 178, 0.9))
    color: #fff

  .hero-top
    display: flex
    justify-content: space-between
    gap: 24px

  .hero-title-row
    display: flex
    align-items: center
    gap: 14px
    margin-bottom: 8px

  .back-button
    color: rgba(255, 255, 255, 0.88)

  .hero-title
    display: flex
    align-items: center
    gap: 10px
    margin: 0
    font-size: 28px

  .hero-desc
    margin: 0
    color: rgba(255, 255, 255, 0.84)
    line-height: 1.7

  .hero-actions
    display: flex
    align-items: flex-start

  .hero-metrics
    margin-top: 20px
    display: grid
    grid-template-columns: repeat(4, minmax(0, 1fr))
    gap: 14px

  .metric-card
    padding: 16px
    border-radius: 16px
    background: rgba(255, 255, 255, 0.14)
    backdrop-filter: blur(8px)

  .metric-label
    display: block
    color: rgba(255, 255, 255, 0.72)
    margin-bottom: 8px
    font-size: 13px

  .metric-card strong
    font-size: 22px
    font-weight: 700

  .metric-path
    display: block
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis

  .workspace
    display: grid
    grid-template-columns: 340px minmax(0, 1fr)
    gap: 18px
    align-items: stretch

  .left-panel,
  .middle-panel,
  .right-panel
    min-height: 0

  .left-panel
    display: grid
    grid-template-rows: auto minmax(0, 1fr)
    gap: 18px

  .middle-panel
    display: flex
    flex-direction: column
    gap: 18px

  .right-panel
    display: flex
    flex-direction: column
    gap: 18px
    grid-column: 1 / -1

  .source-card,
  .detail-card,
  .knowledge-card
    min-height: 0

  .source-card,
  .detail-card
    height: 100%

    :deep(.el-card__body)
      height: calc(100% - 57px)
      display: flex
      flex-direction: column
      min-height: 0

  .card-header
    display: flex
    justify-content: space-between
    align-items: center
    gap: 12px

  .header-actions
    display: flex
    gap: 8px

  .field-hint
    margin-top: 8px
    color: #64748b
    font-size: 12px
    line-height: 1.6

  .upload-section
    display: flex
    flex-direction: column
    gap: 12px

  .upload-title
    font-size: 15px
    font-weight: 600
    color: #0f172a

  .upload-actions
    display: flex
    align-items: center
    gap: 12px

  .upload-file-name
    color: #334155
    font-size: 13px
    word-break: break-all

  .hidden-input
    display: none

  .source-list
    display: flex
    flex-direction: column
    gap: 12px
    flex: 1
    min-height: 0
    overflow-y: auto

  .source-item
    border: 1px solid #dbe5eb
    border-radius: 14px
    padding: 14px
    background: #fff
    text-align: left
    cursor: pointer
    transition: all 0.2s ease

    &.active
      border-color: #0f766e
      box-shadow: 0 10px 24px rgba(15, 118, 110, 0.12)
      background: linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%)

    &:hover
      transform: translateY(-2px)

  .source-item-top
    display: flex
    justify-content: space-between
    gap: 12px
    align-items: flex-start

  .source-name
    font-size: 15px
    font-weight: 700
    color: #0f172a
    line-height: 1.5

  .source-item-meta,
  .source-item-progress
    display: flex
    flex-wrap: wrap
    gap: 10px
    margin-top: 8px
    color: #64748b
    font-size: 12px

  .source-item-error
    margin-top: 8px
    color: #b91c1c
    font-size: 12px
    line-height: 1.5

  .source-summary
    padding: 16px
    border-radius: 14px
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)

  .summary-grid
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 12px

  .summary-item
    display: flex
    flex-direction: column
    gap: 6px

  .summary-label
    color: #64748b
    font-size: 12px

  .summary-path
    word-break: break-all

  .summary-message
    margin-top: 14px
    padding: 12px 14px
    border-radius: 12px
    background: #fff
    color: #334155
    line-height: 1.6

  .section-title
    margin-bottom: 12px
    font-size: 15px
    font-weight: 700
    color: #0f172a

  .section-subtitle
    margin-bottom: 12px
    color: #64748b
    font-size: 12px

  .header-tip
    color: #64748b
    font-size: 12px

  .latest-items
    margin-top: 18px

  .task-timeline
    min-height: 0

  .latest-items
    margin-top: auto

  .latest-item-list
    display: flex
    flex-direction: column
    gap: 12px

  .latest-item
    width: 100%
    text-align: left
    border: 1px solid #e2e8f0
    border-radius: 14px
    padding: 14px
    background: #fff
    cursor: pointer

  .latest-item-title
    font-size: 15px
    font-weight: 700
    color: #0f172a

  .latest-item-meta
    display: flex
    gap: 10px
    flex-wrap: wrap
    margin-top: 8px
    color: #64748b
    font-size: 12px

  .latest-item-summary
    margin-top: 10px
    color: #475569
    font-size: 13px
    line-height: 1.7

  .filters
    display: grid
    grid-template-columns: 1.2fr 0.8fr 0.9fr auto
    gap: 12px
    margin-bottom: 14px

  .filter-actions
    display: flex
    gap: 8px

  .knowledge-list
    display: flex
    flex-direction: column
    gap: 14px
    min-height: 420px

  .knowledge-item
    width: 100%
    text-align: left
    padding: 16px
    border: 1px solid #dbe5eb
    border-radius: 16px
    background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)
    transition: all 0.2s ease
    cursor: pointer

    &:hover
      border-color: #0f766e
      box-shadow: 0 12px 24px rgba(15, 118, 110, 0.08)

  .knowledge-item-top
    display: flex
    justify-content: space-between
    gap: 12px
    align-items: flex-start

  .knowledge-item-title
    font-size: 18px
    font-weight: 700
    color: #0f172a
    line-height: 1.5

  .knowledge-item-actions
    display: flex
    align-items: center
    gap: 8px
    flex-shrink: 0

  .knowledge-item-meta
    display: flex
    flex-wrap: wrap
    gap: 10px
    align-items: center
    margin-top: 12px
    color: #64748b
    font-size: 12px

  .knowledge-item-keywords
    margin-top: 12px
    color: #475569
    font-size: 13px
    line-height: 1.6

  .knowledge-item-summary
    margin-top: 10px
    color: #334155
    font-size: 14px
    line-height: 1.8

  .pagination-row
    margin-top: 14px
    display: flex
    justify-content: flex-end

  .drawer-section
    margin-bottom: 24px

  .drawer-title
    font-size: 24px
    font-weight: 700
    color: #0f172a
    line-height: 1.4

  .drawer-meta
    display: flex
    gap: 10px
    margin-top: 12px
    flex-wrap: wrap

  .drawer-keywords
    margin-top: 12px
    color: #475569
    line-height: 1.6

  .drawer-text
    white-space: pre-wrap
    line-height: 1.8
    color: #334155

  .drawer-text--content
    padding: 14px
    border-radius: 12px
    background: #f8fafc

  .drawer-source-grid
    display: grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
    gap: 10px
    color: #334155

  .evidence-quote
    padding: 12px
    border-radius: 12px
    background: #ecfeff
    color: #155e75
    line-height: 1.7
    margin-bottom: 12px

  .evidence-content
    padding: 12px
    border-radius: 12px
    background: #f8fafc
    color: #334155
    white-space: pre-wrap
    line-height: 1.8

@media (max-width: 900px)
  .medical-knowledge-page
    padding: 14px

    .hero-top
      flex-direction: column

    .hero-metrics
      grid-template-columns: repeat(2, minmax(0, 1fr))

    .workspace
      grid-template-columns: 1fr

    .right-panel
      grid-column: auto

    .filters
      grid-template-columns: 1fr

    .summary-grid,
    .drawer-source-grid
      grid-template-columns: 1fr
</style>
