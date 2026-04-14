<template>
  <div class="my-records-container">
    <div class="header">
      <h3>我的记录</h3>
      <span class="count">共 {{ total }} 条记录</span>
    </div>

    <el-scrollbar class="list-scrollbar" v-loading="loading">
      <div class="record-list">
        <el-card
          v-for="record in recordList"
          :key="record.id"
          class="record-item"
          shadow="hover"
          @click="openEditor(record)"
        >
          <div class="record-header">
            <div class="record-meta">
              <h4 class="record-title">{{ record.title }}</h4>
              <p class="record-summary">{{ record.intro || '暂无简介' }}</p>
            </div>
            <div class="record-side">
              <el-tag :type="getStatusType(record.status)" size="small">
                {{ getStatusText(record.status) }}
              </el-tag>
              <span v-if="record.status === 1" class="edit-limit">
                已修改 {{ record.publishedEditCount || 0 }}/3 次
              </span>
            </div>
          </div>

          <div class="record-footer">
            <span class="record-time">
              <el-icon><Clock /></el-icon>
              {{ formatDate(record.updateTime) }}
            </span>
            <div class="record-actions" @click.stop>
              <el-button text type="primary" @click="openEditor(record)">编辑</el-button>
              <el-button text type="danger" @click="confirmDelete(record)">删除</el-button>
            </div>
          </div>
        </el-card>

        <el-empty v-if="!loading && recordList.length === 0" description="暂无记录" />
      </div>
    </el-scrollbar>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clock } from '@element-plus/icons-vue'
import { deleteArticle, listArticle, type Article } from '../../api/article'
import { confirm } from '@/shared/ui/confirm'
import { message } from '@/shared/ui/feedback'

const router = useRouter()

const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)
const recordList = ref<Article[]>([])

const fetchArticleList = async () => {
  loading.value = true
  try {
    const result = await listArticle(page.value, size.value)
    if (result) {
      recordList.value = result.records
      total.value = result.total
    }
  } finally {
    loading.value = false
  }
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchArticleList()
}

const handleSizeChange = (newSize: number) => {
  size.value = newSize
  page.value = 1
  fetchArticleList()
}

const openEditor = (record: Article) => {
  router.push(`/index/blogEditor/${record.id}`)
}

const confirmDelete = async (record: Article) => {
  const confirmed = await confirm({
    message: `确定要删除《${record.title || '这篇文章'}》吗？此操作不可恢复。`,
    confirmText: '删除',
  })
  if (!confirmed) return
  const success = await deleteArticle(record.id)
  if (!success) {
    return
  }

  message.success('删除成功')
  if (recordList.value.length === 1 && page.value > 1) {
    page.value -= 1
  }
  fetchArticleList()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) {
    return ''
  }

  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const getStatusType = (status: number) => {
  const typeMap: Record<number, 'info' | 'success' | 'warning'> = {
    0: 'info',
    1: 'success',
    [-1]: 'warning',
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    0: '草稿',
    1: '已发布',
    [-1]: '已删除',
  }
  return textMap[status] || '未知'
}

onMounted(() => {
  fetchArticleList()
})

onActivated(() => {
  fetchArticleList()
})

defineExpose({
  reload: fetchArticleList,
})
</script>

<style scoped lang="scss">
.my-records-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #fff;
    border-radius: 10px;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: #1f2937;
      font-size: 20px;
    }

    .count {
      color: #6b7280;
      font-size: 14px;
    }
  }

  .list-scrollbar {
    flex: 1;
    height: 0;
  }

  .record-list {
    padding: 0 20px 20px;
  }

  .record-item {
    margin-bottom: 16px;
    cursor: pointer;
    border-radius: 14px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }

    .record-header {
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }

    .record-meta {
      flex: 1;
      min-width: 0;
    }

    .record-title {
      margin: 0 0 10px;
      font-size: 18px;
      color: #111827;
    }

    .record-summary {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.7;
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .record-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }

    .edit-limit {
      color: #6b7280;
      font-size: 12px;
    }

    .record-footer {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .record-time {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
      font-size: 13px;
    }

    .record-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .pagination-container {
    padding: 20px;
    background: #fff;
    border-radius: 10px;
    display: flex;
    justify-content: center;
  }
}
</style>
