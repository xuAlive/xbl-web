<template>
  <div class="browsing-history-container">
    <div class="list-view" v-loading="loading">
      <div class="header">
        <h3>浏览记录</h3>
        <el-button
          type="danger"
          size="small"
          :disabled="historyList.length === 0"
          @click="handleClearHistory"
        >
          清空记录
        </el-button>
      </div>

      <el-scrollbar class="list-scrollbar">
        <div v-if="historyList.length" class="history-list">
          <el-card
            v-for="history in historyList"
            :key="history.id"
            class="history-item"
            shadow="hover"
            @click="goToArticle(history.articleId)"
          >
            <div class="history-header">
              <h4 class="history-title">{{ history.title }}</h4>
              <div class="history-actions">
                <el-tag type="info" size="small">{{ history.author }}</el-tag>
                <el-button
                  text
                  type="danger"
                  size="small"
                  @click.stop="handleDeleteHistory(history)"
                >
                  删除
                </el-button>
              </div>
            </div>

            <div class="history-info">
              <div class="info-row">
                <span class="info-label">创建时间:</span>
                <span class="info-value">{{ formatDate(history.articleCreateTime) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">最后浏览:</span>
                <span class="info-value">{{ formatDate(history.lastViewTime) }}</span>
              </div>
            </div>

            <div class="history-footer">
              <span class="footer-tip">
                <el-icon><View /></el-icon>
                点击继续查看文章
              </span>
            </div>
          </el-card>
        </div>

        <el-empty v-else-if="!loading" description="暂无浏览记录" />
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onActivated, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { View } from '@element-plus/icons-vue'
import { clearBrowsingHistory, deleteBrowsingHistory, listBrowsingHistory, type BrowsingHistoryItem } from '@/api/article'
import { confirm } from '@/shared/ui/confirm'

const router = useRouter()
const loading = ref(false)
const historyList = ref<BrowsingHistoryItem[]>([])

const loadHistoryList = async () => {
  loading.value = true
  try {
    historyList.value = await listBrowsingHistory()
  } finally {
    loading.value = false
  }
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const goToArticle = (articleId: number) => {
  router.push(`/index/articleDetail/${articleId}`)
}

const handleDeleteHistory = async (history: BrowsingHistoryItem) => {
  const confirmed = await confirm({
    message: `确定删除《${history.title}》的浏览记录吗？`,
    confirmText: '删除',
  })
  if (!confirmed) return
  const success = await deleteBrowsingHistory(history.id)
  if (!success) return
  historyList.value = historyList.value.filter(item => item.id !== history.id)
  message.success('浏览记录已删除')
}

const handleClearHistory = async () => {
  const confirmed = await confirm({
    message: '确定要清空所有浏览记录吗？此操作不可恢复。',
    confirmText: '删除',
  })
  if (!confirmed) return
  const success = await clearBrowsingHistory()
  if (!success) return
  historyList.value = []
  message.success('浏览记录已清空')
}

onMounted(() => {
  loadHistoryList()
})

onActivated(() => {
  loadHistoryList()
})

defineExpose({
  reload: loadHistoryList
})
</script>

<style scoped lang="sass">
.browsing-history-container
  height: 100%
  background: #f5f7fa

  .list-view
    height: 100%
    display: flex
    flex-direction: column

    .header
      display: flex
      justify-content: space-between
      align-items: center
      padding: 20px
      background: white
      border-radius: 8px
      margin-bottom: 20px

      h3
        margin: 0
        color: #2c5282
        font-size: 20px

    .list-scrollbar
      flex: 1
      height: 0

    .history-list
      padding: 0 20px 20px

      .history-item
        margin-bottom: 15px
        cursor: pointer
        transition: all 0.3s

        &:hover
          transform: translateY(-3px)
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)

        .history-header
          display: flex
          justify-content: space-between
          align-items: flex-start
          gap: 16px
          margin-bottom: 15px

          .history-title
            margin: 0
            color: #2d3748
            font-size: 16px
            font-weight: 600
            line-height: 1.5

          .history-actions
            display: flex
            align-items: center
            gap: 8px

        .history-info
          display: flex
          flex-direction: column
          gap: 8px
          margin-bottom: 15px

          .info-row
            display: flex
            gap: 8px
            font-size: 14px
            color: #4a5568

            .info-label
              color: #718096

            .info-value
              color: #2d3748

        .history-footer
          padding-top: 12px
          border-top: 1px solid #edf2f7

          .footer-tip
            display: inline-flex
            align-items: center
            gap: 6px
            color: #718096
            font-size: 13px
            gap: 8px
            flex-shrink: 0

        .history-info
          margin-bottom: 15px

          .info-row
            display: flex
            gap: 10px
            margin-bottom: 8px
            font-size: 14px

            .info-label
              color: #718096
              min-width: 80px

            .info-value
              color: #2d3748

        .history-footer
          display: flex
          justify-content: flex-end
          padding-top: 10px
          border-top: 1px solid #e2e8f0

          .footer-tip
            display: flex
            align-items: center
            gap: 5px
            color: #a0aec0
            font-size: 13px
</style>
