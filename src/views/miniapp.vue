<template>
  <div class="miniapp-container">
    <el-card class="header-card">
      <h2 class="page-title">小程序中心</h2>
      <p class="page-desc">这里是小程序管理中心，您可以管理和使用各种小程序工具</p>
    </el-card>

    <el-row
      :gutter="20"
      class="miniapp-grid"
      v-loading="loading || openingApp"
      element-loading-background="rgba(245, 247, 250, 0.72)"
    >
      <el-col :span="6" v-for="app in miniApps" :key="app.id">
        <el-card
          shadow="hover"
          class="miniapp-card"
          :class="{ 'is-opening': openingApp }"
          @click="openApp(app)"
        >
          <div class="card-icon">
            <el-icon :size="60" :color="app.color">
              <component :is="getIconComponent(app.icon)" />
            </el-icon>
          </div>
          <h3 class="card-title">{{ app.name }}</h3>
          <p class="card-desc">{{ app.intro }}</p>
          <div class="card-footer">
            <el-tag :type="app.tagType" size="small">
              {{ app.category }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && miniApps.length === 0" description="暂无小程序" />
  </div>
</template>

<script setup lang="ts">
import { ref, onActivated, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { message } from '@/shared/ui/feedback'
import {
  ChatDotSquare,
  Document,
  Search,
  Calendar,
  ShoppingCart,
  Picture,
  HomeFilled,
  Clock,
  DataBoard,
  Bell,
  Notebook,
  Reading
} from '@element-plus/icons-vue'
import { checkMiniappAvailable, checkMiniappRoute, getMiniappList, type Miniapp } from '../api/miniapp'

const router = useRouter()
const loading = ref(false)
const openingApp = ref(false)
const miniApps = ref<Miniapp[]>([])

// 图标映射
const iconMap: Record<string, any> = {
  'ChatDotSquare': markRaw(ChatDotSquare),
  'Document': markRaw(Document),
  'Search': markRaw(Search),
  'Calendar': markRaw(Calendar),
  'ShoppingCart': markRaw(ShoppingCart),
  'Picture': markRaw(Picture),
  'Clock': markRaw(Clock),
  'DataBoard': markRaw(DataBoard),
  'Bell': markRaw(Bell),
  'Notebook': markRaw(Notebook),
  'Reading': markRaw(Reading),
}

// 获取图标组件
const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || HomeFilled
}

// 加载小程序列表
const loadMiniapps = async () => {
  loading.value = true
  miniApps.value = await getMiniappList()
  loading.value = false
}

// 打开应用
const openApp = async (app: Miniapp) => {
  if (openingApp.value) {
    return
  }

  openingApp.value = true
  try {
    const available = await checkMiniappAvailable(app.id)
    if (!available) {
      await loadMiniapps()
      return
    }

    if (app.route) {
      const available = await checkMiniappRoute(app.route)
      if (!available) {
        await loadMiniapps()
        return
      }
      await router.push(app.route)
    } else if (app.externalLink) {
      window.open(app.externalLink, '_blank')
    } else {
      message.info(`${app.name} 功能开发中...`)
    }
  } finally {
    openingApp.value = false
  }
}

onMounted(() => {
  loadMiniapps()
})

onActivated(() => {
  loadMiniapps()
})
</script>

<style scoped lang="sass">
.miniapp-container
  padding: 20px
  background: #f5f7fa
  height: 100%
  overflow-y: auto

  .header-card
    margin-bottom: 20px
    text-align: center

    .page-title
      font-size: 28px
      color: #2c5282
      margin: 0 0 10px 0
      font-family: var(--font-family-base)

    .page-desc
      color: #718096
      margin: 0
      font-size: 14px

  .miniapp-grid
    margin-top: 20px

  .miniapp-card
    margin-bottom: 20px
    transition: all 0.3s
    text-align: center
    cursor: pointer

    &.is-opening
      pointer-events: none
      opacity: 0.72

    &:hover
      transform: translateY(-8px)
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2)

    .card-icon
      margin-bottom: 15px

    .card-title
      font-size: 18px
      font-weight: 600
      color: #2d3748
      margin: 10px 0

    .card-desc
      font-size: 14px
      color: #718096
      line-height: 1.6
      min-height: 60px
      margin: 10px 0

    .card-footer
      margin-top: 15px
      padding-top: 15px
      border-top: 1px solid #e2e8f0
</style>
