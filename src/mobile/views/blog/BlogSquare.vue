<template>
  <div class="blog-square">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索文章..."
        clearable
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 文章列表 -->
    <div class="article-list" v-loading="loading">
      <div
        v-for="article in articles"
        :key="article.id"
        class="article-card"
        @click="goDetail(article.id)"
      >
        <div class="article-content">
          <div class="article-meta">
            <el-avatar :size="24" class="author-avatar">
              {{ (article.account || 'U').charAt(0).toUpperCase() }}
            </el-avatar>
            <span class="author-name">{{ article.account }}</span>
            <span class="publish-time">{{ formatTime(article.createTime) }}</span>
          </div>
          <h3 class="article-title">{{ article.title }}</h3>
          <p class="article-intro">{{ article.intro || getExcerpt(article.content) }}</p>
        </div>
        <div v-if="getCoverImage(article.img)" class="article-cover">
          <img :src="getCoverImage(article.img)" alt="封面" />
        </div>
      </div>

      <el-empty v-if="articles.length === 0 && !loading" description="暂无文章" />

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">
        <span>{{ loadingMore ? '加载中...' : '加载更多' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { listPublicArticles, type Article } from '../../api/article'

const router = useRouter()

const searchText = ref('')
const articles = ref<Article[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = 10
const hasMore = ref(true)

// 加载文章列表
const loadArticles = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    articles.value = []
  }

  try {
    const res = await listPublicArticles(page.value, pageSize, searchText.value || undefined)
    if (res) {
      if (isLoadMore) {
        articles.value.push(...res.records)
      } else {
        articles.value = res.records
      }
      hasMore.value = articles.value.length < res.total
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 搜索
const handleSearch = () => {
  loadArticles()
}

// 加载更多
const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  page.value++
  loadArticles(true)
}

// 跳转详情
const goDetail = (id: number) => {
  router.push(`/blog/detail/${id}`)
}

// 获取封面图
const getCoverImage = (img: string | null) => {
  if (!img) return null
  try {
    const images = JSON.parse(img)
    return images && images.length > 0 ? images[0] : null
  } catch {
    return null
  }
}

// 获取摘要
const getExcerpt = (content: string) => {
  if (!content) return '暂无摘要'
  const text = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  return text.length > 80 ? text.slice(0, 80) + '...' : text
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const now = new Date()
  const time = new Date(timeStr)
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return timeStr.split(' ')[0]
}

onMounted(() => {
  loadArticles()
})
</script>

<style scoped lang="scss">
.blog-square {
  padding: 15px;
}

.search-bar {
  margin-bottom: 15px;

  :deep(.el-input__wrapper) {
    border-radius: 20px;
    background: #fff;
  }
}

.article-list {
  .article-card {
    display: flex;
    gap: 12px;
    background: #fff;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 12px;
    cursor: pointer;

    &:active {
      background: #fafafa;
    }

    .article-content {
      flex: 1;
      min-width: 0;

      .article-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #999;

        .author-avatar {
          background: #409EFF;
          color: #fff;
          font-size: 12px;
        }

        .author-name {
          color: #666;
        }
      }

      .article-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .article-intro {
        font-size: 13px;
        color: #999;
        line-height: 1.5;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .article-cover {
      width: 100px;
      height: 75px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 20px;
  color: #409EFF;
  font-size: 14px;
  cursor: pointer;
}
</style>
