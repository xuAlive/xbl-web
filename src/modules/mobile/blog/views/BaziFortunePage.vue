<template>
  <div class="mobile-bazi-page">
    <header class="mobile-bazi-header">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <div class="header-copy">
        <strong>八字运势</strong>
        <span>命盘测算与合盘分析</span>
      </div>
    </header>

    <BaziFortuneView mobile-mode />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

import BaziFortuneView from '@/modules/blog/views/BaziFortunePage.vue'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.mobile-bazi-page {
  min-height: 100vh;
  background: #fffaf3;
}

.mobile-bazi-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 14px;
  background: rgba(180, 83, 9, 0.08);
  color: #1f2937;
}

.header-copy {
  display: flex;
  flex-direction: column;
}

.header-copy strong {
  color: #182338;
  font-size: 16px;
}

.header-copy span {
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
}
</style>
