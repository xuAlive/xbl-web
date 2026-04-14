<template>
  <div class="diary-container">
    <!-- 顶部导航 -->
    <div class="diary-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <span class="header-title">日记本</span>
      <el-icon class="calendar-icon" @click="goCalendar" v-if="!isCalendar"><Calendar /></el-icon>
      <div class="header-right" v-else></div>
    </div>

    <!-- 内容区域 -->
    <div class="diary-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Calendar } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const isCalendar = computed(() => route.path.includes('/diary/calendar'))

const goBack = () => {
  if (route.path.includes('/diary/edit') || route.path.includes('/diary/calendar')) {
    router.push('/diary')
  } else {
    router.push('/')
  }
}

const goCalendar = () => {
  router.push('/diary/calendar')
}
</script>

<style scoped lang="scss">
.diary-container {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.diary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);

  .back-icon, .calendar-icon {
    font-size: 22px;
    color: #fff;
    cursor: pointer;
  }

  .header-title {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
  }

  .header-right {
    width: 22px;
  }
}

.diary-content {
  flex: 1;
  overflow-y: auto;
}
</style>
