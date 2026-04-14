<template>
  <div class="effects-manage-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">鼠标特效管理</span>
          <span class="subtitle">选择一个你喜欢的鼠标跟随特效</span>
        </div>
      </template>

      <div class="effects-grid">
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="effect-card"
          :class="{ active: theme.id === activeThemeId }"
          @click="switchTheme(theme.id)"
        >
          <EffectPreview
            :theme="theme"
            :width="280"
            :height="180"
            :active="theme.id === activeThemeId"
          />
          <div class="effect-info">
            <h3 class="effect-name">{{ theme.name }}</h3>
            <p class="effect-desc">{{ theme.description }}</p>
            <el-button
              v-if="theme.id === activeThemeId"
              type="success"
              size="small"
              disabled
              round
            >
              当前使用中
            </el-button>
            <el-button
              v-else
              type="primary"
              size="small"
              round
              @click.stop="switchTheme(theme.id)"
            >
              使用此特效
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getThemeList, getThemeById, type EffectTheme } from '../../config/cursorEffects'
import EffectPreview from '../../components/EffectPreview.vue'
import { message } from '@/shared/ui/feedback'

const STORAGE_KEY = 'cursor_effect_theme'
const themes = ref<EffectTheme[]>(getThemeList())
const activeThemeId = ref<string>(localStorage.getItem(STORAGE_KEY) || 'ocean')

const switchTheme = (themeId: string) => {
  if (themeId === activeThemeId.value) return
  activeThemeId.value = themeId
  localStorage.setItem(STORAGE_KEY, themeId)
  window.dispatchEvent(new CustomEvent('cursor-effect-change', { detail: themeId }))
  message.success(`已切换为「${getThemeById(themeId).name}」特效`)
}
</script>

<style scoped lang="scss">
.effects-manage-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;

  .card-header {
    display: flex;
    align-items: baseline;
    gap: 12px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .subtitle {
      font-size: 13px;
      color: #909399;
    }
  }
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.effect-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s;
  cursor: pointer;

  &.active {
    border-color: #409eff;
    box-shadow: 0 0 16px rgba(64, 158, 255, 0.25);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  .effect-info {
    padding: 16px;

    .effect-name {
      margin: 0 0 6px;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .effect-desc {
      margin: 0 0 12px;
      font-size: 13px;
      color: #909399;
      line-height: 1.4;
    }
  }
}
</style>
