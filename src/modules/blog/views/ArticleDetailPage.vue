<template>
  <div class="zhihu-article-detail">
    <div class="article-wrapper" v-loading="articleLoading">
      <template v-if="article">
        <h1 class="article-title">{{ article.title }}</h1>

        <div class="author-bar">
          <el-avatar :size="48" class="author-avatar">
            {{ (article.account || 'U').charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="author-info">
            <span class="author-name">{{ article.account }}</span>
            <div class="publish-meta">
              <span>{{ formatDate(article.createTime) }}</span>
            </div>
          </div>
        </div>

        <div class="article-summary" v-if="article.intro">
          <p>{{ article.intro }}</p>
        </div>

        <div class="article-cover" v-if="getCoverImage(article.img)">
          <img :src="getCoverImage(article.img)" alt="封面" />
        </div>

        <div class="article-content" v-html="article.content"></div>

        <div class="article-footer">
          <el-button @click="goBack" round>
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
        </div>
      </template>
      <el-empty v-else-if="!articleLoading" description="文章不存在">
        <el-button type="primary" @click="goBack">返回博客广场</el-button>
      </el-empty>
    </div>

    <div class="comment-section">
      <div class="comment-header">
        <h3>评论 <span class="count">{{ comments.length }}</span></h3>
      </div>

      <div class="comment-form">
        <el-avatar :size="40" class="form-avatar">
          {{ userInitial }}
        </el-avatar>
        <div class="form-input">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
            maxlength="500"
            show-word-limit
          />
          <el-button
            type="primary"
            @click="submitComment"
            :loading="submitting"
            :disabled="!newComment.trim()"
          >
            发表评论
          </el-button>
        </div>
      </div>

      <div class="comment-list" v-loading="commentLoading">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <el-avatar :size="40" class="comment-avatar">
            {{ (comment.commenterName || comment.commenterAccount || 'U').charAt(0) }}
          </el-avatar>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="commenter-name">{{ comment.commenterName || comment.commenterAccount }}</span>
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <span class="action-btn" @click="showReplyForm(comment.id)">
                <el-icon><ChatDotRound /></el-icon>
                回复
              </span>
            </div>

            <div v-if="replyingTo === comment.id" class="reply-form">
              <el-input
                v-model="replyContent"
                placeholder="写下你的回复..."
                maxlength="500"
              />
              <div class="reply-actions">
                <el-button size="small" @click="cancelReply">取消</el-button>
                <el-button size="small" type="primary" @click="submitReply(comment.id)" :loading="submitting">
                  回复
                </el-button>
              </div>
            </div>

            <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                <el-avatar :size="28" class="reply-avatar">
                  {{ (reply.commenterName || reply.commenterAccount || 'U').charAt(0) }}
                </el-avatar>
                <div class="reply-content">
                  <span class="reply-author">{{ reply.commenterName || reply.commenterAccount }}</span>
                  <span class="reply-text">{{ reply.content }}</span>
                  <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-if="comments.length === 0 && !commentLoading" description="暂无评论，快来抢沙发吧~" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { ArrowLeft, ChatDotRound } from '@element-plus/icons-vue'
import { getArticleById, type Article } from '@/api/article'
import { listCommentsByArticle, addComment, type Comment } from '@/api/comment'
import { isLoggedIn, getAccount } from '@/utils/userInfo'

const route = useRoute()
const router = useRouter()

const article = ref<Article | null>(null)
const articleLoading = ref(false)
const comments = ref<Comment[]>([])
const commentLoading = ref(false)
const newComment = ref('')
const replyingTo = ref<number | null>(null)
const replyContent = ref('')
const submitting = ref(false)

const userInitial = computed(() => {
  const account = getAccount()
  return account ? account.charAt(0).toUpperCase() : 'U'
})

const getCoverImage = (img: string | null) => {
  if (!img) return null
  try {
    const images = JSON.parse(img)
    return images && images.length > 0 ? images[0] : null
  } catch {
    return null
  }
}

const loadArticle = async () => {
  articleLoading.value = true
  try {
    const id = Number(route.params.id)
    article.value = await getArticleById(id)
  } finally {
    articleLoading.value = false
  }
}

const loadComments = async () => {
  commentLoading.value = true
  try {
    const id = Number(route.params.id)
    comments.value = await listCommentsByArticle(id)
  } finally {
    commentLoading.value = false
  }
}

const submitComment = async () => {
  if (!isLoggedIn()) {
    message.warning('请先登录后再评论')
    return
  }
  if (!newComment.value.trim()) {
    message.warning('请输入评论内容')
    return
  }
  submitting.value = true
  try {
    const id = Number(route.params.id)
    const success = await addComment(id, newComment.value.trim(), 0)
    if (success) {
      message.success('评论成功')
      newComment.value = ''
      loadComments()
    }
  } finally {
    submitting.value = false
  }
}

const showReplyForm = (commentId: number) => {
  if (!isLoggedIn()) {
    message.warning('请先登录后再回复')
    return
  }
  replyingTo.value = commentId
  replyContent.value = ''
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

const submitReply = async (parentId: number) => {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }
  submitting.value = true
  try {
    const id = Number(route.params.id)
    const success = await addComment(id, replyContent.value.trim(), parentId)
    if (success) {
      message.success('回复成功')
      replyingTo.value = null
      replyContent.value = ''
      loadComments()
    }
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.push('/index/home')
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}年${month}月${day}日 ${hour}:${minute}`
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const now = new Date()
  const time = new Date(timeStr)
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return formatDate(timeStr)
}

onMounted(() => {
  loadArticle()
  loadComments()
})
</script>

<style scoped lang="scss">
.zhihu-article-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #fff;
  height: 100%;
  overflow-y: auto;

  .article-wrapper {
    margin-bottom: 48px;

    .article-title {
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.4;
      margin: 0 0 24px 0;
    }

    .author-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #f0f0f0;

      .author-avatar {
        background: #1890ff;
        color: #fff;
        font-size: 18px;
      }

      .author-info {
        .author-name {
          font-size: 16px;
          font-weight: 500;
          color: #1a1a1a;
          display: block;
          margin-bottom: 4px;
        }

        .publish-meta {
          font-size: 14px;
          color: #8590a6;
        }
      }
    }

    .article-summary {
      background: #f7f8fa;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;

      p {
        margin: 0;
        font-size: 15px;
        color: #595959;
        line-height: 1.7;
      }
    }

    .article-cover {
      margin-bottom: 24px;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        display: block;
      }
    }

    .article-content {
      font-size: 16px;
      line-height: 1.8;
      color: #1a1a1a;

      :deep(p) {
        margin: 0 0 20px 0;
      }

      :deep(h1) {
        font-size: 24px;
        margin: 32px 0 16px 0;
        font-weight: 600;
      }

      :deep(h2) {
        font-size: 22px;
        margin: 28px 0 14px 0;
        font-weight: 600;
      }

      :deep(h3) {
        font-size: 20px;
        margin: 24px 0 12px 0;
        font-weight: 600;
      }

      :deep(h4), :deep(h5), :deep(h6) {
        font-size: 18px;
        margin: 20px 0 10px 0;
        font-weight: 600;
      }

      :deep(blockquote) {
        margin: 20px 0;
        padding: 12px 20px;
        background: #f7f8fa;
        border-left: 4px solid #1890ff;
        color: #595959;

        p {
          margin: 0;
        }
      }

      :deep(ul), :deep(ol) {
        margin: 16px 0;
        padding-left: 28px;

        li {
          margin-bottom: 8px;
        }
      }

      :deep(img) {
        max-width: 100%;
        border-radius: 4px;
        margin: 16px 0;
      }

      :deep(code) {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace;
        font-size: 14px;
        color: #c7254e;
      }

      :deep(pre) {
        background: #282c34;
        padding: 16px 20px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 20px 0;

        code {
          background: transparent;
          color: #abb2bf;
          padding: 0;
          font-size: 14px;
        }
      }

      :deep(a) {
        color: #1890ff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      :deep(table) {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;

        th, td {
          border: 1px solid #e8e8e8;
          padding: 10px 12px;
          text-align: left;
        }

        th {
          background: #fafafa;
          font-weight: 500;
        }
      }

      :deep(hr) {
        border: none;
        border-top: 1px solid #e8e8e8;
        margin: 24px 0;
      }
    }

    .article-footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
    }
  }

  .comment-section {
    .comment-header {
      margin-bottom: 24px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;

        .count {
          font-size: 14px;
          color: #8590a6;
          font-weight: 400;
          margin-left: 8px;
        }
      }
    }

    .comment-form {
      display: flex;
      gap: 12px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #f0f0f0;

      .form-avatar {
        flex-shrink: 0;
        background: #52c41a;
        color: #fff;
      }

      .form-input {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: flex-end;

        .el-textarea {
          width: 100%;
        }
      }
    }

    .comment-list {
      .comment-item {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;

        .comment-avatar {
          flex-shrink: 0;
          background: #1890ff;
          color: #fff;
        }

        .comment-body {
          flex: 1;

          .comment-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .commenter-name {
              font-size: 15px;
              font-weight: 500;
              color: #1a1a1a;
            }

            .comment-time {
              font-size: 13px;
              color: #8590a6;
            }
          }

          .comment-text {
            font-size: 15px;
            color: #1a1a1a;
            line-height: 1.7;
            margin: 0 0 12px 0;
          }

          .comment-actions {
            .action-btn {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 13px;
              color: #8590a6;
              cursor: pointer;
              transition: color 0.2s;

              &:hover {
                color: #1890ff;
              }
            }
          }

          .reply-form {
            margin-top: 16px;
            padding: 16px;
            background: #f7f8fa;
            border-radius: 8px;

            .el-input {
              margin-bottom: 12px;
            }

            .reply-actions {
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            }
          }

          .replies-list {
            margin-top: 16px;
            padding: 16px;
            background: #f7f8fa;
            border-radius: 8px;

            .reply-item {
              display: flex;
              gap: 10px;
              margin-bottom: 12px;

              &:last-child {
                margin-bottom: 0;
              }

              .reply-avatar {
                flex-shrink: 0;
                background: #52c41a;
                color: #fff;
                font-size: 12px;
              }

              .reply-content {
                flex: 1;
                font-size: 14px;
                line-height: 1.6;

                .reply-author {
                  font-weight: 500;
                  color: #1a1a1a;
                  margin-right: 8px;
                }

                .reply-text {
                  color: #1a1a1a;
                }

                .reply-time {
                  font-size: 12px;
                  color: #8590a6;
                  margin-left: 12px;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
