<template>
  <div class="blog-container">
    <!-- 顶部导航 -->
    <div class="blog-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <div class="header-tabs">
        <div
          class="tab-item"
          :class="{ active: currentTab === 'square' }"
          @click="switchTab('square')"
        >博客广场</div>
      <div
        class="tab-item"
        :class="{ active: currentTab === 'my' }"
        @click="switchTab('my')"
      >我的博客</div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'history' }"
          @click="switchTab('history')"
        >浏览记录</div>
      </div>
      <el-icon class="edit-icon" @click="goEdit"><EditPen /></el-icon>
    </div>

    <!-- 内容区域 -->
    <div class="blog-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, EditPen } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const currentTab = computed(() => {
  if (route.path.includes('/blog/my')) return 'my'
  if (route.path.includes('/blog/history')) return 'history'
  return 'square'
})

const goBack = () => {
  router.push('/')
}

const switchTab = (tab: string) => {
  router.push(`/blog/${tab}`)
}

const goEdit = () => {
  router.push('/blog/edit')
}
</script>

<style scoped lang="scss">
.blog-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.blog-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;

  .back-icon, .edit-icon {
    font-size: 22px;
    color: #333;
    cursor: pointer;
    padding: 5px;
  }

  .header-tabs {
    flex: 1;
    display: flex;
    justify-content: center;
    gap: 18px;

    .tab-item {
      font-size: 15px;
      color: #666;
      padding: 8px 0;
      position: relative;
      cursor: pointer;

      &.active {
        color: #409EFF;
        font-weight: 600;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background: #409EFF;
          border-radius: 2px;
        }
      }
    }
  }
}

.blog-content {
  flex: 1;
  overflow-y: auto;
}
</style>
