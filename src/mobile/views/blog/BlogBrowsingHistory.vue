<template>
  <div class="history-page" v-loading="loading">
    <div v-if="historyList.length" class="history-list">
      <div
        v-for="history in historyList"
        :key="history.id"
        class="history-card"
        @click="goDetail(history.articleId)"
      >
        <div class="card-top">
          <div class="title">{{ history.title }}</div>
          <button class="delete-btn" @click.stop="handleDelete(history)">删除</button>
        </div>
        <div class="meta-row">
          <span class="label">作者</span>
          <span class="value">{{ history.author }}</span>
        </div>
        <div class="meta-row">
          <span class="label">创建时间</span>
          <span class="value">{{ formatDate(history.articleCreateTime) }}</span>
        </div>
        <div class="meta-row">
          <span class="label">最后浏览</span>
          <span class="value">{{ formatDate(history.lastViewTime) }}</span>
        </div>
      </div>
    </div>

    <el-empty v-else-if="!loading" description="暂无浏览记录">
      <el-button v-if="historyList.length === 0" type="primary" @click="goSquare">去看看文章</el-button>
    </el-empty>

    <div v-if="historyList.length" class="bottom-bar">
      <el-button plain @click="goSquare">去广场</el-button>
      <el-button type="danger" @click="handleClear">清空记录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { clearBrowsingHistory, deleteBrowsingHistory, listBrowsingHistory, type BrowsingHistoryItem } from '@/mobile/api/article'
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

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const goDetail = (articleId: number) => {
  router.push(`/blog/detail/${articleId}`)
}

const goSquare = () => {
  router.push('/blog/square')
}

const handleDelete = async (history: BrowsingHistoryItem) => {
  const confirmed = await confirm({
    message: `删除《${history.title}》的浏览记录？`,
    confirmText: '删除',
  })
  if (!confirmed) return
  const success = await deleteBrowsingHistory(history.id)
  if (!success) return
  historyList.value = historyList.value.filter(item => item.id !== history.id)
  message.success('已删除')
}

const handleClear = async () => {
  const confirmed = await confirm({
    message: '确定清空全部浏览记录吗？',
    confirmText: '删除',
  })
  if (!confirmed) return
  const success = await clearBrowsingHistory()
  if (!success) return
  historyList.value = []
  message.success('已清空')
}

onMounted(() => {
  loadHistoryList()
})
</script>

<style scoped lang="scss">
.history-page {
  min-height: 100%;
  padding: 12px 12px 88px;
  background: #f5f5f5;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.title {
  font-size: 15px;
  line-height: 1.5;
  font-weight: 600;
  color: #1f2937;
}

.delete-btn {
  border: none;
  background: transparent;
  color: #ef4444;
  font-size: 13px;
  padding: 0;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.value {
  color: #374151;
  text-align: right;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.06);
}

.bottom-bar :deep(.el-button) {
  flex: 1;
}
</style>
