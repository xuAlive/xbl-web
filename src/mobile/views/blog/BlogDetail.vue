<template>
  <div class="blog-detail">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <span class="header-title">文章详情</span>
      <div class="header-right"></div>
    </div>

    <!-- 文章内容 -->
    <div class="detail-content" v-loading="loading">
      <template v-if="article">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <el-avatar :size="32" class="author-avatar">
            {{ (article.account || 'U').charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="meta-info">
            <span class="author-name">{{ article.account }}</span>
            <span class="publish-time">{{ formatDate(article.createTime) }}</span>
          </div>
        </div>
        <div class="article-body markdown-body" v-html="article.content"></div>
      </template>
      <el-empty v-else-if="!loading" description="文章不存在" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getArticleById, type Article } from '../../api/article'

const router = useRouter()
const route = useRoute()

const article = ref<Article | null>(null)
const loading = ref(false)

const goBack = () => {
  router.back()
}

const loadArticle = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    article.value = await getArticleById(id)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadArticle()
})
</script>

<style scoped lang="scss">
.blog-detail {
  min-height: 100vh;
  background: #fff;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;

  .back-icon {
    font-size: 22px;
    color: #333;
    cursor: pointer;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .header-right {
    width: 22px;
  }
}

.detail-content {
  padding: 20px 15px;

  .article-title {
    font-size: 22px;
    font-weight: 700;
    color: #333;
    line-height: 1.4;
    margin: 0 0 20px;
  }

  .article-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 20px;

    .author-avatar {
      background: #409EFF;
      color: #fff;
      font-size: 14px;
    }

    .meta-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .author-name {
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }

      .publish-time {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .article-body {
    font-size: 16px;
    line-height: 1.8;
    color: #333;

    :deep(img) {
      max-width: 100%;
      border-radius: 8px;
      margin: 10px 0;
    }

    :deep(p) {
      margin-bottom: 16px;
    }

    :deep(h1), :deep(h2), :deep(h3) {
      margin-top: 24px;
      margin-bottom: 12px;
    }

    :deep(pre) {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
    }

    :deep(code) {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 14px;
    }
  }
}
</style>
