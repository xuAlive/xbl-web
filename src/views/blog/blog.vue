<template>
  <div class="zhihu-editor-container">
    <div class="top-bar">
      <div class="left-actions">
        <span class="brand">{{ pageTitle }}</span>
        <span v-if="isPublishedEditMode" class="edit-tip">
          已发布文章还可修改 {{ remainingEditCount }} 次
        </span>
      </div>
      <div class="right-actions">
        <el-button v-if="isEditMode" @click="goBackToRecords">返回记录</el-button>
        <el-button
          v-if="!isPublishedEditMode"
          @click="handleSaveDraft"
          :loading="saving"
        >
          保存草稿
        </el-button>
        <el-button
          type="primary"
          @click="showPublishDialog"
          :loading="publishing"
          :disabled="isPublishedEditMode && remainingEditCount <= 0"
        >
          {{ primaryActionLabel }}
        </el-button>
      </div>
    </div>

    <div class="editor-main" v-loading="pageLoading">
      <div class="title-input-wrapper">
        <input
          v-model="blogTitle"
          type="text"
          class="title-input"
          placeholder="请输入标题（最多100字）"
          maxlength="100"
        />
        <span class="title-count">{{ blogTitle.length }}/100</span>
      </div>

      <Suspense>
        <template #default>
          <AsyncBlogRichTextEditor
            ref="editorPanelRef"
            v-model="valueHtml"
            :upload-image="uploadImage"
          />
        </template>
        <template #fallback>
          <div class="editor-loading">
            <div class="loading-title">编辑器加载中...</div>
            <div class="loading-tip">首次打开会稍慢一点，马上就好</div>
          </div>
        </template>
      </Suspense>
    </div>

    <el-dialog
      v-model="publishDialogVisible"
      :title="publishDialogTitle"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="publish-settings">
        <div class="setting-item">
          <label class="setting-label">
            <span class="required">*</span>
            编写摘要
          </label>
          <el-input
            v-model="blogIntro"
            type="textarea"
            :rows="4"
            placeholder="摘要会展示在文章列表，帮助读者快速了解内容（最多200字）"
            maxlength="200"
            show-word-limit
          />
        </div>

        <div class="setting-item">
          <label class="setting-label">添加封面</label>
          <div class="cover-upload">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              accept="image/*"
            >
              <div v-if="coverImage" class="cover-preview">
                <img :src="coverImage" alt="封面" />
                <div class="cover-actions">
                  <el-icon @click.stop="removeCover"><Delete /></el-icon>
                </div>
              </div>
              <div v-else class="cover-placeholder">
                <el-icon><Plus /></el-icon>
                <span>上传封面</span>
              </div>
            </el-upload>
            <div class="cover-tips">
              <p>建议尺寸：900 x 500</p>
              <p>支持 jpg、png 格式</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="publishDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePublish" :loading="publishing">
            {{ primaryActionLabel }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import { Delete, Plus } from '@element-plus/icons-vue'
import { getArticleById, publishArticle, saveDraft as saveDraftApi, uploadImage, type Article } from '../../api/article'

const AsyncBlogRichTextEditor = defineAsyncComponent(() => import('@/modules/blog/components/BlogRichTextEditor.vue'))
const editorPanelRef = ref<{ getText: () => string; destroy: () => void } | null>(null)
const route = useRoute()
const router = useRouter()

const blogTitle = ref('')
const blogIntro = ref('')
const valueHtml = ref('')
const coverImage = ref('')
const currentArticleId = ref<number | null>(null)
const currentStatus = ref(0)
const publishedEditCount = ref(0)

const saving = ref(false)
const publishing = ref(false)
const pageLoading = ref(false)
const publishDialogVisible = ref(false)

let autoSaveTimer: number | null = null

const routeArticleId = computed(() => {
  const rawId = route.params.id
  if (!rawId) {
    return null
  }
  const articleId = Number(rawId)
  return Number.isNaN(articleId) ? null : articleId
})

const isEditMode = computed(() => routeArticleId.value !== null)
const isPublishedEditMode = computed(() => isEditMode.value && currentStatus.value === 1)
const remainingEditCount = computed(() => Math.max(0, 3 - publishedEditCount.value))
const pageTitle = computed(() => {
  if (isPublishedEditMode.value) {
    return '修改已发布文章'
  }
  return isEditMode.value ? '编辑草稿' : '新作发布'
})
const primaryActionLabel = computed(() => (isPublishedEditMode.value ? '保存修改' : '发布'))
const publishDialogTitle = computed(() => (isPublishedEditMode.value ? '保存修改' : '发布设置'))

const getLocalDraftKey = () => {
  if (currentArticleId.value) {
    return `blog_draft_${currentArticleId.value}`
  }
  return 'blog_draft'
}

const fillForm = (article: Partial<Article>) => {
  currentArticleId.value = article.id ?? null
  currentStatus.value = article.status ?? 0
  publishedEditCount.value = article.publishedEditCount ?? 0
  blogTitle.value = article.title ?? ''
  blogIntro.value = article.intro ?? ''
  valueHtml.value = article.content ?? ''

  const images = article.img ? JSON.parse(article.img) : []
  coverImage.value = Array.isArray(images) && images.length > 0 ? images[0] : ''
}

const saveLocalDraft = () => {
  try {
    const draftData = {
      id: currentArticleId.value,
      status: currentStatus.value,
      publishedEditCount: publishedEditCount.value,
      title: blogTitle.value,
      intro: blogIntro.value,
      content: valueHtml.value,
      cover: coverImage.value,
      updateTime: new Date().toISOString(),
    }
    localStorage.setItem(getLocalDraftKey(), JSON.stringify(draftData))
  } catch (error) {
    console.error('保存草稿失败:', error)
  }
}

const loadLocalDraft = () => {
  try {
    const draft = localStorage.getItem(getLocalDraftKey())
    if (!draft) {
      return false
    }

    const draftData = JSON.parse(draft)
    currentArticleId.value = draftData.id ?? currentArticleId.value
    currentStatus.value = draftData.status ?? currentStatus.value
    publishedEditCount.value = draftData.publishedEditCount ?? publishedEditCount.value
    blogTitle.value = draftData.title || ''
    blogIntro.value = draftData.intro || ''
    valueHtml.value = draftData.content || ''
    coverImage.value = draftData.cover || ''
    return true
  } catch (error) {
    console.error('加载草稿失败:', error)
    return false
  }
}

const clearDraft = () => {
  try {
    localStorage.removeItem(getLocalDraftKey())
    if (!isEditMode.value) {
      currentArticleId.value = null
      currentStatus.value = 0
      publishedEditCount.value = 0
    }
  } catch (error) {
    console.error('清除草稿失败:', error)
  }
}

const resetForm = () => {
  blogTitle.value = ''
  blogIntro.value = ''
  valueHtml.value = ''
  coverImage.value = ''
  currentArticleId.value = routeArticleId.value
  currentStatus.value = 0
  publishedEditCount.value = 0
}

const scheduleAutoSave = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = window.setTimeout(() => {
    saveLocalDraft()
  }, 3000)
}

const beforeCoverUpload = async (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB!')
    return false
  }

  const url = await uploadImage(file)
  if (url) {
    coverImage.value = url
  }
  return false
}

const removeCover = () => {
  coverImage.value = ''
}

const ensureArticleContent = () => {
  if (!blogTitle.value.trim()) {
    message.warning('请输入文章标题')
    return false
  }

  const textContent = editorPanelRef.value?.getText() || ''
  if (!textContent.trim()) {
    message.warning('请输入文章内容')
    return false
  }
  return true
}

const handleSaveDraft = async () => {
  if (!ensureArticleContent()) {
    return
  }

  saving.value = true
  saveLocalDraft()

  const imgArray = coverImage.value ? [coverImage.value] : []
  const result = await saveDraftApi(
    blogTitle.value,
    valueHtml.value,
    blogIntro.value,
    imgArray,
    currentArticleId.value ?? undefined,
  )

  saving.value = false
  if (!result) {
    return
  }

  currentArticleId.value = result.id
  currentStatus.value = result.status
  publishedEditCount.value = result.publishedEditCount ?? 0
  saveLocalDraft()
  message.success('草稿保存成功')
}

const showPublishDialog = () => {
  if (!ensureArticleContent()) {
    return
  }

  if (isPublishedEditMode.value && remainingEditCount.value <= 0) {
    message.warning('该文章已达到 3 次修改上限')
    return
  }

  const textContent = editorPanelRef.value?.getText() || ''
  if (!blogIntro.value.trim()) {
    blogIntro.value = textContent.slice(0, 150).replace(/\s+/g, ' ').trim()
  }
  publishDialogVisible.value = true
}

const handlePublish = async () => {
  if (!blogIntro.value.trim()) {
    message.warning('请编写文章摘要')
    return
  }

  publishing.value = true
  const imgArray = coverImage.value ? [coverImage.value] : []
  const result = await publishArticle(
    blogTitle.value,
    valueHtml.value,
    blogIntro.value,
    imgArray,
    currentArticleId.value ?? undefined,
  )
  publishing.value = false

  if (!result) {
    return
  }

  publishDialogVisible.value = false
  currentArticleId.value = result.id
  currentStatus.value = result.status
  publishedEditCount.value = result.publishedEditCount ?? 0
  clearDraft()

  if (isEditMode.value) {
    message.success(isPublishedEditMode.value ? '文章修改已保存' : '文章发布成功')
    goBackToRecords()
    return
  }

  resetForm()
  localStorage.removeItem('blog_draft')
  message.success('文章发布成功!')
}

const loadArticleForEdit = async (id: number) => {
  pageLoading.value = true
  const article = await getArticleById(id, false)
  pageLoading.value = false

  if (!article) {
    message.error('文章不存在或已被删除')
    router.replace('/index/blogInfo')
    return
  }

  fillForm(article)
  const hasLocalDraft = loadLocalDraft()
  if (hasLocalDraft) {
    message.info('已恢复本地编辑内容')
  }
}

const initPage = async () => {
  resetForm()
  if (isEditMode.value && routeArticleId.value) {
    await loadArticleForEdit(routeArticleId.value)
    return
  }

  const hasLocalDraft = loadLocalDraft()
  if (hasLocalDraft) {
    message.info('已加载上次保存的草稿')
  }
}

const goBackToRecords = () => {
  router.push('/index/blogInfo')
}

watch(
  () => route.fullPath,
  () => {
    initPage()
  },
)

watch([blogTitle, blogIntro, valueHtml, coverImage], () => {
  scheduleAutoSave()
})

onMounted(() => {
  initPage()
})

onBeforeUnmount(() => {
  editorPanelRef.value?.destroy()
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<style scoped lang="scss">
.zhihu-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;

    .left-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .brand {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .edit-tip {
        padding: 6px 10px;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 13px;
      }
    }

    .right-actions {
      display: flex;
      gap: 12px;
    }
  }

  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    padding: 24px 48px;
    overflow: hidden;

    .title-input-wrapper {
      position: relative;
      margin-bottom: 24px;

      .title-input {
        width: 100%;
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
        border: none;
        outline: none;
        padding: 8px 0;
        border-bottom: 2px solid transparent;
        transition: border-color 0.3s;

        &::placeholder {
          color: #bfbfbf;
          font-weight: 400;
        }

        &:focus {
          border-bottom-color: #1890ff;
        }
      }

      .title-count {
        position: absolute;
        right: 0;
        bottom: 12px;
        font-size: 12px;
        color: #bfbfbf;
      }
    }

    .editor-loading {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      background: linear-gradient(180deg, #fafafa 0%, #f5f7fa 100%);
      color: #4b5563;
      gap: 8px;

      .loading-title {
        font-size: 18px;
        font-weight: 600;
      }

      .loading-tip {
        font-size: 13px;
        color: #6b7280;
      }
    }
  }

  .publish-settings {
    .setting-item {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .setting-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;

        .required {
          color: #ff4d4f;
          margin-right: 4px;
        }
      }
    }

    .cover-upload {
      display: flex;
      gap: 16px;

      .cover-uploader {
        width: 180px;
        height: 100px;

        :deep(.el-upload) {
          width: 100%;
          height: 100%;
        }
      }

      .cover-preview {
        position: relative;
        width: 180px;
        height: 100px;
        border-radius: 4px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-actions {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;

          .el-icon {
            font-size: 24px;
            color: #fff;
            cursor: pointer;
          }
        }

        &:hover .cover-actions {
          opacity: 1;
        }
      }

      .cover-placeholder {
        width: 180px;
        height: 100px;
        border: 1px dashed #d9d9d9;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #bfbfbf;
        cursor: pointer;
        transition: border-color 0.3s;

        &:hover {
          border-color: #1890ff;
          color: #1890ff;
        }

        .el-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
      }

      .cover-tips {
        color: #8c8c8c;
        font-size: 12px;
        line-height: 1.8;
      }
    }
  }
}
</style>
