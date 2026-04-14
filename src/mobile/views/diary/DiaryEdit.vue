<template>
  <div class="diary-edit">
    <!-- 顶部导航 -->
    <div class="edit-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <span class="header-title">{{ isEdit ? '编辑日记' : '写日记' }}</span>
      <el-button type="primary" size="small" @click="saveDiary" :loading="saving">保存</el-button>
    </div>

    <!-- 日期和心情 -->
    <div class="diary-meta">
      <div class="meta-item" @click="showDatePicker = true">
        <el-icon><Calendar /></el-icon>
        <span>{{ formatDisplayDate(form.eventDate) }}</span>
        <span class="days-info">{{ getDaysInfo(form.eventDate) }}</span>
      </div>
    </div>

    <!-- 心情选择 -->
    <div class="mood-section">
      <span class="label">今日心情</span>
      <div class="mood-selector">
        <span
          v-for="mood in moodOptions"
          :key="mood"
          class="mood-item"
          :class="{ active: form.mood === mood }"
          @click="form.mood = mood"
        >{{ mood }}</span>
      </div>
    </div>

    <!-- 类型选择 -->
    <div class="type-section">
      <span class="label">类型</span>
      <div class="type-selector">
        <span
          v-for="t in eventTypes"
          :key="t.value"
          class="type-item"
          :class="{ active: form.eventType === t.value }"
          @click="form.eventType = t.value"
        >{{ t.label }}</span>
      </div>
    </div>

    <!-- 标题输入 -->
    <div class="title-section">
      <el-input
        v-model="form.title"
        placeholder="给这篇日记起个标题"
        maxlength="50"
        class="title-input"
      />
    </div>

    <!-- 内容编辑 -->
    <div class="content-section">
      <el-input
        v-model="form.content"
        type="textarea"
        placeholder="记录今天的心情和故事..."
        :autosize="{ minRows: 8 }"
        class="content-input"
      />
    </div>

    <!-- 日期选择器 -->
    <el-dialog v-model="showDatePicker" title="选择日期" width="90%">
      <el-date-picker
        v-model="form.eventDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        style="width: 100%"
      />
      <template #footer>
        <el-button @click="showDatePicker = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Calendar } from '@element-plus/icons-vue'
import { message } from '@/shared/ui/feedback'
import { getMonthEvents, getEventById, createEvent, updateEvent, type CalendarEvent } from '../../api/calendar'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const saving = ref(false)
const showDatePicker = ref(false)

const moodOptions = ['😊', '😢', '😠', '😴', '🤔', '😍', '🎉', '💪', '🌟', '❤️']
const eventTypes = [
  { value: 2, label: '日记' },
  { value: 1, label: '待办' },
  { value: 3, label: '纪念日' }
]

const form = reactive<CalendarEvent>({
  title: '',
  content: '',
  eventDate: formatDate(new Date()),
  eventTime: '',
  eventType: 2,
  priority: 2,
  mood: ''
})

function formatDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(date: string) {
  if (!date) return ''
  const d = new Date(date)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
}

function getDaysInfo(date: string) {
  if (!date) return ''
  const target = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  if (diff > 0) return `${diff}天后`
  return `${Math.abs(diff)}天前`
}

const goBack = () => {
  router.back()
}

const saveDiary = async () => {
  if (!form.title.trim()) {
    message.warning('请输入标题')
    return
  }
  if (!form.eventDate) {
    message.warning('请选择日期')
    return
  }

  saving.value = true
  try {
    let success = false
    if (isEdit.value && form.id) {
      success = await updateEvent(form)
    } else {
      success = await createEvent(form)
    }

    if (success) {
      router.back()
    }
  } finally {
    saving.value = false
  }
}

// 加载日记详情
const loadDiary = async (id: number) => {
  const diary = await getEventById(id)
  if (diary) {
    Object.assign(form, diary)
  }
}

onMounted(() => {
  // 检查是否是编辑模式
  const id = route.params.id
  if (id) {
    isEdit.value = true
    loadDiary(Number(id))
  } else {
    // 检查 URL 参数中的日期
    const date = route.query.date as string
    if (date) {
      form.eventDate = date
    }
  }
})
</script>

<style scoped lang="scss">
.diary-edit {
  min-height: 100vh;
  background: #fff;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 100;

  .back-icon {
    font-size: 22px;
    color: #333;
    cursor: pointer;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
}

.diary-meta {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #333;
    cursor: pointer;

    .el-icon {
      color: #F56C6C;
    }

    .days-info {
      color: #F56C6C;
      font-size: 13px;
    }
  }
}

.mood-section, .type-section {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;

  .label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
  }
}

.mood-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  .mood-item {
    font-size: 24px;
    padding: 5px;
    border-radius: 8px;
    cursor: pointer;
    opacity: 0.5;
    transition: all 0.2s;

    &.active {
      opacity: 1;
      transform: scale(1.2);
      background: #fff3e0;
    }
  }
}

.type-selector {
  display: flex;
  gap: 10px;

  .type-item {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    color: #666;
    background: #f5f5f5;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background: #F56C6C;
      color: #fff;
    }
  }
}

.title-section {
  padding: 15px;

  .title-input {
    :deep(.el-input__wrapper) {
      box-shadow: none;
      padding: 0;
    }

    :deep(.el-input__inner) {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.content-section {
  padding: 0 15px 15px;

  .content-input {
    :deep(.el-textarea__inner) {
      border: none;
      box-shadow: none;
      font-size: 16px;
      line-height: 1.8;
      resize: none;
    }
  }
}
</style>
