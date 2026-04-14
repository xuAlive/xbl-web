<template>
  <div class="schedule-container">
    <!-- 顶部导航 -->
    <div class="schedule-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <div class="header-tabs">
        <div
          class="tab-item"
          :class="{ active: currentTab === 'my' }"
          @click="switchTab('my')"
        >我的排班</div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'manage' }"
          @click="switchTab('manage')"
        >排班管理</div>
        <div
          class="tab-item"
          :class="{ active: currentTab === 'employee' }"
          @click="switchTab('employee')"
        >员工管理</div>
      </div>
      <div class="header-right"></div>
    </div>

    <!-- 内容区域 -->
    <div class="schedule-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const currentTab = computed(() => {
  if (route.path.includes('/schedule/employee')) return 'employee'
  if (route.path.includes('/schedule/manage')) return 'manage'
  return 'my'
})

const goBack = () => {
  router.push('/')
}

const switchTab = (tab: string) => {
  router.push(`/schedule/${tab}`)
}
</script>

<style scoped lang="scss">
.schedule-container {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.schedule-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .back-icon {
    font-size: 22px;
    color: #fff;
    cursor: pointer;
  }

  .header-tabs {
    flex: 1;
    display: flex;
    justify-content: center;
    gap: 25px;

    .tab-item {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.7);
      padding: 8px 0;
      position: relative;
      cursor: pointer;

      &.active {
        color: #fff;
        font-weight: 600;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background: #fff;
          border-radius: 2px;
        }
      }
    }
  }

  .header-right {
    width: 22px;
  }
}

.schedule-content {
  flex: 1;
  overflow-y: auto;
}
</style>
