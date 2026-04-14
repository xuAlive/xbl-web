<template>
  <div class="blog-my">
    <!-- Tab 切换 -->
    <div class="my-tabs">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'published' }"
        @click="activeTab = 'published'"
      >已发布</div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'draft' }"
        @click="activeTab = 'draft'"
      >草稿箱</div>
    </div>

    <!-- 文章列表 -->
    <div class="article-list" v-loading="loading">
      <div
        v-for="article in filteredArticles"
        :key="article.id"
        class="article-card"
        @click="goDetail(article.id)"
      >
        <h3 class="article-title">{{ article.title }}</h3>
        <p class="article-intro">{{ article.intro || getExcerpt(article.content) }}</p>
        <div class="article-footer">
          <span class="article-time">{{ formatDate(article.createTime) }}</span>
          <el-tag v-if="article.status === 0" type="info" size="small">草稿</el-tag>
        </div>
      </div>

      <el-empty v-if="filteredArticles.length === 0 && !loading" :description="emptyText">
        <el-button type="primary" @click="goEdit">写文章</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listArticle, type Article } from '../../api/article'

const router = useRouter()

const activeTab = ref('published')
const articles = ref<Article[]>([])
const loading = ref(false)

// 过滤文章
const filteredArticles = computed(() => {
  if (activeTab.value === 'published') {
    return articles.value.filter(a => a.status === 1)
  }
  return articles.value.filter(a => a.status === 0)
})

const emptyText = computed(() => {
  return activeTab.value === 'published' ? '暂无已发布的文章' : '暂无草稿'
})

// 加载文章
const loadArticles = async () => {
  loading.value = true
  try {
    const res = await listArticle(1, 100)
    if (res) {
      articles.value = res.records
    }
  } finally {
    loading.value = false
  }
}

// 跳转详情
const goDetail = (id: number) => {
  router.push(`/blog/detail/${id}`)
}

// 跳转编辑
const goEdit = () => {
  router.push('/blog/edit')
}

// 获取摘要
const getExcerpt = (content: string) => {
  if (!content) return '暂无内容'
  const text = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  return text.length > 50 ? text.slice(0, 50) + '...' : text
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}

onMounted(() => {
  loadArticles()
})
</script>

<style scoped lang="scss">
.blog-my {
  padding: 15px;
}

.my-tabs {
  display: flex;
  background: #fff;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 15px;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 10px;
    font-size: 14px;
    color: #666;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background: #409EFF;
      color: #fff;
    }
  }
}

.article-list {
  .article-card {
    background: #fff;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 12px;
    cursor: pointer;

    &:active {
      background: #fafafa;
    }

    .article-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px;
      line-height: 1.4;
    }

    .article-intro {
      font-size: 13px;
      color: #999;
      line-height: 1.5;
      margin: 0 0 10px;
    }

    .article-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .article-time {
        font-size: 12px;
        color: #ccc;
      }
    }
  }
}
</style>
