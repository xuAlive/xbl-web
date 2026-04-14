<template>
  <div class="diary-write">
    <!-- 日期选择 -->
    <div class="date-section" @click="showDatePicker = true">
      <el-icon><Calendar /></el-icon>
      <span>{{ formatDisplayDate(form.eventDate) }}</span>
      <span class="days-info">{{ getDaysInfo(form.eventDate) }}</span>
      <el-icon class="arrow"><ArrowRight /></el-icon>
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
        :autosize="{ minRows: 10 }"
        class="content-input"
      />
    </div>

    <!-- 保存按钮 -->
    <div class="save-section">
      <el-button type="primary" size="large" @click="saveDiary" :loading="saving" round>
        保存日记
      </el-button>
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
        <el-button type="primary" @click="showDatePicker = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, ArrowRight } from '@element-plus/icons-vue'
import { message } from '@/shared/ui/feedback'
import { createEvent, type CalendarEvent } from '../../api/calendar'

const router = useRouter()
const route = useRoute()

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
    const success = await createEvent(form)
    if (success) {
      // 重置表单
      form.title = ''
      form.content = ''
      form.mood = ''
      form.eventType = 2
      form.eventDate = formatDate(new Date())
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // 检查 URL 参数中的日期
  const date = route.query.date as string
  if (date) {
    form.eventDate = date
  }
})
</script>

<style scoped lang="scss">
.diary-write {
  padding: 15px;
  padding-bottom: 100px;
}

.date-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 15px;
  cursor: pointer;

  .el-icon {
    color: #F56C6C;
  }

  span {
    font-size: 15px;
    color: #333;
  }

  .days-info {
    color: #F56C6C;
    font-size: 13px;
  }

  .arrow {
    margin-left: auto;
    color: #ccc;
  }
}

.mood-section {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;

  .label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
  }

  .mood-selector {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .mood-item {
      font-size: 26px;
      padding: 6px;
      border-radius: 10px;
      cursor: pointer;
      opacity: 0.4;
      transition: all 0.2s;

      &.active {
        opacity: 1;
        transform: scale(1.15);
        background: #fff3e0;
      }
    }
  }
}

.type-section {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;

  .type-selector {
    display: flex;
    gap: 10px;

    .type-item {
      flex: 1;
      text-align: center;
      padding: 10px;
      border-radius: 10px;
      font-size: 14px;
      color: #666;
      background: #f5f5f5;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
        color: #fff;
      }
    }
  }
}

.title-section {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;

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
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;

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

.save-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  .el-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
    border: none;
  }
}
</style>
