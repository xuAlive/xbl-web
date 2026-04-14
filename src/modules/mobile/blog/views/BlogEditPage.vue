<template>
  <div class="blog-edit">
    <div class="edit-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <span class="header-title">写文章</span>
      <div class="header-actions">
        <el-button size="small" @click="handleSaveDraft" :loading="saving">存草稿</el-button>
        <el-button type="primary" size="small" @click="handlePublish" :loading="publishing">发布</el-button>
      </div>
    </div>

    <div class="edit-content">
      <el-input
        v-model="title"
        placeholder="请输入文章标题..."
        class="title-input"
        maxlength="100"
      />
      <el-input
        v-model="intro"
        type="textarea"
        placeholder="请输入文章简介（可选）..."
        :rows="2"
        maxlength="200"
        class="intro-input"
      />
      <el-input
        v-model="content"
        type="textarea"
        placeholder="请输入文章内容..."
        class="content-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { message } from '@/shared/ui/feedback'
import { saveDraft, publishArticle } from '@/mobile/api/article'

const router = useRouter()

const title = ref('')
const intro = ref('')
const content = ref('')
const saving = ref(false)
const publishing = ref(false)

const goBack = () => {
  router.back()
}

const handleSaveDraft = async () => {
  if (!title.value.trim()) {
    message.warning('请输入文章标题')
    return
  }

  saving.value = true
  try {
    const success = await saveDraft(title.value, content.value, intro.value)
    if (success) {
      message.success('草稿保存成功')
      router.push('/blog/my')
    }
  } finally {
    saving.value = false
  }
}

const handlePublish = async () => {
  if (!title.value.trim()) {
    message.warning('请输入文章标题')
    return
  }
  if (!content.value.trim()) {
    message.warning('请输入文章内容')
    return
  }

  publishing.value = true
  try {
    const success = await publishArticle(title.value, content.value, intro.value)
    if (success) {
      message.success('发布成功')
      router.push('/blog/my')
    }
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped lang="scss">
.blog-edit {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.edit-header {
  display: flex;
  align-items: center;
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
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.edit-content {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .title-input {
    :deep(.el-input__wrapper) {
      box-shadow: none;
      padding: 0;
    }

    :deep(.el-input__inner) {
      font-size: 20px;
      font-weight: 600;
    }
  }

  .intro-input {
    :deep(.el-textarea__inner) {
      resize: none;
      border: none;
      box-shadow: none;
      padding: 10px 0;
      font-size: 14px;
      color: #666;
    }
  }

  .content-input {
    flex: 1;

    :deep(.el-textarea__inner) {
      height: 100% !important;
      min-height: 300px;
      resize: none;
      border: none;
      box-shadow: none;
      font-size: 16px;
      line-height: 1.8;
    }
  }
}
</style>
