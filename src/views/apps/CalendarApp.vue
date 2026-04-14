<template>
  <div class="calendar-container">
    <transition name="slide-down">
      <div v-if="currentNotification" class="notification-bar">
        <div class="notification-content">
          <el-icon><Bell /></el-icon>
          <span class="notification-title">{{ currentNotification.title }}</span>
          <span class="notification-time">{{ formatNotificationTime(currentNotification.remindTime) }}</span>
        </div>
        <el-button type="primary" link @click="dismissNotification">标为已读</el-button>
      </div>
    </transition>

    <div class="workspace-shell">
      <section class="workspace-header">
        <div class="header-main">
          <el-button @click="goBack" class="back-button" text>
            <el-icon><ArrowLeft /></el-icon>
            返回应用
          </el-button>
          <div class="header-copy">
            <h2 class="page-title">
              <el-icon><Notebook /></el-icon>
              日记本
            </h2>
          </div>
        </div>

        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-label">选中日期</span>
            <span class="stat-value">{{ selectedDateText }}</span>
          </div>
          <button class="stat-chip stat-chip-button" type="button" @click="openDetailDialog('month')">
            <span class="stat-label">本月记录</span>
            <span class="stat-value">{{ currentMonthDiaryCount }} 篇</span>
          </button>
          <button class="stat-chip stat-chip-button" type="button" @click="openDetailDialog('reminder')">
            <span class="stat-label">待发送提醒</span>
            <span class="stat-value">{{ reminders.length }} 条</span>
          </button>
        </div>

        <div class="header-actions">
          <el-button
            class="header-action-button"
            type="primary"
            @click="showDiaryDialog()"
            plain
          >
            写日记
          </el-button>
          <el-button
            class="header-action-button"
            @click="showReminderDialog()"
          >
            设置提醒
          </el-button>
        </div>
      </section>

      <section class="calendar-stage">
        <el-card class="calendar-panel">
          <div class="calendar-stage-inner">
            <div class="calendar-board">
              <div class="month-nav">
                <div class="month-title-group">
                  <span class="month-caption">月历总览</span>
                  <span class="month-title">{{ currentYear }}年 {{ currentMonth }}月</span>
                </div>
                <div class="month-actions">
                  <el-button @click="prevMonth" icon="ArrowLeft" circle size="small" />
                  <el-button @click="nextMonth" icon="ArrowRight" circle size="small" />
                  <el-button type="primary" plain @click="goToday">回到今天</el-button>
                </div>
              </div>

              <div class="calendar-grid">
                <div class="weekday-header">
                  <span v-for="day in weekDayNames" :key="day" class="weekday">{{ day }}</span>
                </div>
                <div class="day-grid">
                  <div
                    v-for="(day, index) in calendarDays"
                    :key="index"
                    class="day-cell"
                    :class="{
                      'other-month': !day.isCurrentMonth,
                      'today': day.isToday,
                      'selected': day.date === selectedDate,
                      'has-diary': hasDiary(day.date)
                    }"
                    @click="selectDate(day)"
                  >
                    <div class="day-topline">
                      <span class="day-number">{{ day.day }}</span>
                      <span v-if="hasDiary(day.date)" class="day-badge">{{ getDiaryCount(day.date) }}</span>
                    </div>
                    <span class="lunar-text">{{ day.lunar }}</span>
                    <div class="diary-dot" v-if="hasDiary(day.date)"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="calendar-sidepanel">
              <button class="side-card date-card date-card-button" type="button" @click="openDetailDialog('selected')">
                <span class="side-caption">当前选中</span>
                <div class="side-date">{{ selectedDateText }}</div>
                <div class="side-helper">{{ getDaysInfo(selectedDate) }}</div>
                <div class="side-count">
                  <strong>{{ selectedDateDiaries.length }}</strong>
                  <span>篇记录</span>
                </div>
              </button>

              <div class="side-card notification-card" v-if="currentNotification">
                <div class="side-card-title">
                  <el-icon><Bell /></el-icon>
                  正在提醒
                </div>
                <div class="side-card-text">{{ currentNotification.title }}</div>
                <div class="side-card-meta">{{ formatNotificationTime(currentNotification.remindTime) }}</div>
                <el-button type="primary" plain size="small" @click="dismissNotification">标为已读</el-button>
              </div>

              <div class="side-card side-card-muted" v-else>
                <div class="side-card-title">
                  <el-icon><Bell /></el-icon>
                  今日提醒
                </div>
                <div class="side-card-text">
                  {{ todayPendingReminder ? todayPendingReminder.title : '今天没有待提醒内容' }}
                </div>
                <div class="side-card-meta">
                  {{ todayPendingReminder ? formatDateTime(todayPendingReminder.remindTime) : '可以继续添加新的提醒安排' }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </section>

    </div>

    <!-- 日记对话框 -->
    <el-dialog v-model="diaryDialogVisible" :title="isEditDiary ? '编辑日记' : '写日记'" width="500px">
      <el-form :model="diaryForm" label-width="80px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="diaryForm.eventDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 200px"
          />
          <span class="days-hint" style="margin-left: 10px; color: #909399;">
            {{ getDaysInfo(diaryForm.eventDate) }}
          </span>
        </el-form-item>
        <el-form-item label="心情">
          <div class="mood-selector">
            <span
              v-for="mood in moodOptions"
              :key="mood"
              class="mood-option"
              :class="{ active: diaryForm.mood === mood }"
              @click="diaryForm.mood = mood"
            >{{ mood }}</span>
          </div>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="diaryForm.title" placeholder="给这篇日记起个标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="diaryForm.content"
            type="textarea"
            :rows="6"
            placeholder="记录今天的心情和故事..."
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="diaryForm.eventType">
            <el-radio :label="2">日记</el-radio>
            <el-radio :label="1">待办</el-radio>
            <el-radio :label="3">纪念日</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="diaryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDiary">保存</el-button>
      </template>
    </el-dialog>

    <!-- 提醒对话框 -->
    <el-dialog v-model="reminderDialogVisible" title="设置提醒" width="500px">
      <el-form :model="reminderForm" label-width="100px">
        <el-form-item label="提醒标题" required>
          <el-input
            v-model="reminderForm.title"
            placeholder="请输入提醒标题"
            maxlength="20"
            show-word-limit
          />
          <div class="form-hint">标题不超过20字，将显示在通知栏</div>
        </el-form-item>
        <el-form-item label="提醒时间" required>
          <el-date-picker
            v-model="reminderForm.remindTime"
            type="datetime"
            placeholder="选择提醒时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="通知方式" required>
          <el-select v-model="reminderForm.notificationType" placeholder="选择通知方式" style="width: 100%">
            <el-option
              v-for="method in notificationMethods"
              :key="method.code"
              :value="method.code"
              :label="method.name"
            >
              <div class="notification-option">
                <span>{{ method.name }}</span>
                <el-tag v-if="method.implStatus === 0" type="info" size="small">未实现</el-tag>
              </div>
            </el-option>
          </el-select>
          <div class="form-hint" v-if="selectedMethodNotImplemented">
            该通知方式尚未实现，提醒将不会发送
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reminderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveReminder">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" :title="detailDialogTitle" width="640px">
      <div class="detail-dialog-body">
        <div class="detail-dialog-summary">{{ detailDialogSummary }}</div>

        <div v-if="detailDialogType === 'month'" class="detail-scroll">
          <div v-if="monthDiaryDetails.length" class="detail-list">
            <div v-for="diary in monthDiaryDetails" :key="`month-${diary.id ?? diary.eventDate + diary.title}`" class="detail-item">
              <div class="detail-item-top">
                <span class="detail-item-title">{{ diary.title }}</span>
                <span class="detail-item-meta">{{ normalizeDateValue(diary.eventDate) }}</span>
              </div>
              <div class="detail-item-sub">
                <span>{{ getEventTypeText(diary.eventType) }}</span>
                <span v-if="diary.eventTime">{{ diary.eventTime }}</span>
                <span v-if="diary.mood">{{ diary.mood }}</span>
              </div>
              <div v-if="diary.content" class="detail-item-content">{{ diary.content }}</div>
            </div>
          </div>
          <el-empty v-else description="本月暂无记录" :image-size="80" />
        </div>

        <div v-else-if="detailDialogType === 'reminder'" class="detail-scroll">
          <div v-if="pendingReminderDetails.length" class="detail-list">
            <div v-for="reminder in pendingReminderDetails" :key="`reminder-${reminder.id ?? reminder.remindTime}`" class="detail-item">
              <div class="detail-item-top">
                <span class="detail-item-title">{{ reminder.title || '提醒' }}</span>
                <span class="detail-item-meta">{{ formatDateTime(reminder.remindTime) }}</span>
              </div>
              <div class="detail-item-sub">
                <span>{{ getReminderStatusText(reminder.status ?? 1) }}</span>
                <span>{{ reminder.notificationType || 'app' }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="当前没有待发送提醒" :image-size="80" />
        </div>

        <div v-else class="detail-scroll">
          <div v-if="selectedDiaryDetailsForDialog.length" class="detail-list">
            <div v-for="diary in selectedDiaryDetailsForDialog" :key="`selected-${diary.id ?? diary.eventDate + diary.title}`" class="detail-item">
              <div class="detail-item-top">
                <span class="detail-item-title">{{ diary.title }}</span>
                <span class="detail-item-meta">{{ normalizeDateValue(diary.eventDate) }}</span>
              </div>
              <div class="detail-item-sub">
                <span>{{ getEventTypeText(diary.eventType) }}</span>
                <span v-if="diary.eventTime">{{ diary.eventTime }}</span>
                <span v-if="diary.mood">{{ diary.mood }}</span>
              </div>
              <div v-if="diary.content" class="detail-item-content">{{ diary.content }}</div>
            </div>
          </div>
          <el-empty v-else description="当前选中日期暂无记录" :image-size="80" />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Notebook, Bell, ArrowLeft, ArrowRight
} from '@element-plus/icons-vue'
import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import {
  getMonthEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getReminderList,
  createReminder,
  getNotificationMethods,
  getPendingNotifications,
  markNotificationAsRead,
  type CalendarEvent,
  type Reminder,
  type NotificationMethod,
  type AppNotification
} from '../../api/calendar'

// 农历数据
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0
]

const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

const moodOptions = ['😊', '😢', '😠', '😴', '🤔', '😍', '🎉', '💪', '🌟', '❤️']

const router = useRouter()

// 状态
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const selectedDate = ref(formatDate(new Date()))

const diaries = ref<CalendarEvent[]>([])
const reminders = ref<Reminder[]>([])
const notificationMethods = ref<NotificationMethod[]>([])
const pendingNotifications = ref<AppNotification[]>([])
const currentNotification = ref<AppNotification | null>(null)

const diaryLoading = ref(false)
const reminderLoading = ref(false)

// 对话框
const diaryDialogVisible = ref(false)
const reminderDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEditDiary = ref(false)
const detailDialogType = ref<'month' | 'reminder' | 'selected'>('month')

// 表单
const diaryForm = ref<CalendarEvent>({
  title: '',
  content: '',
  eventDate: '',
  eventTime: '',
  eventType: 2,
  priority: 2,
  mood: ''
})

const reminderForm = ref<Partial<Reminder>>({
  title: '',
  remindTime: '',
  notificationType: 'app'
})

const weekDayNames = ['日', '一', '二', '三', '四', '五', '六']

// 获取农历
function getLunar(year: number, month: number, day: number) {
  const baseDate = new Date(1900, 0, 31)
  const objDate = new Date(year, month - 1, day)
  let offset = Math.floor((objDate.getTime() - baseDate.getTime()) / 86400000)

  let lunarYear = 1900
  let daysInYear = 0
  for (let i = 1900; i < 2100 && offset > 0; i++) {
    daysInYear = getLunarYearDays(i)
    offset -= daysInYear
    lunarYear++
  }
  if (offset < 0) {
    offset += daysInYear
    lunarYear--
  }

  let lunarMonth = 1
  let isLeap = false
  const leapMonth = getLeapMonth(lunarYear)
  for (let i = 1; i < 13 && offset > 0; i++) {
    let daysInMonth
    if (leapMonth > 0 && i === leapMonth + 1 && !isLeap) {
      --i
      isLeap = true
      daysInMonth = getLeapDays(lunarYear)
    } else {
      daysInMonth = getLunarMonthDays(lunarYear, i)
    }
    if (isLeap && i === leapMonth + 1) isLeap = false
    offset -= daysInMonth
    if (!isLeap) lunarMonth++
  }
  if (offset === 0 && leapMonth > 0 && lunarMonth === leapMonth + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      --lunarMonth
    }
  }
  if (offset < 0) {
    offset += getLunarMonthDays(lunarYear, lunarMonth)
    --lunarMonth
  }

  const lunarDay = offset + 1
  return lunarDays[lunarDay - 1]
}

function getLunarYearDays(year: number) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[year - 1900] & i) ? 1 : 0
  }
  return sum + getLeapDays(year)
}

function getLeapMonth(year: number) {
  return lunarInfo[year - 1900] & 0xf
}

function getLeapDays(year: number) {
  if (getLeapMonth(year)) {
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

function getLunarMonthDays(year: number, month: number) {
  return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29
}

// 计算日历天数
const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)

  const startDayOfWeek = firstDay.getDay()
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate()

  // 上月的天数
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const date = new Date(currentYear.value, currentMonth.value - 2, d)
    days.push({
      day: d,
      date: formatDate(date),
      lunar: getLunar(date.getFullYear(), date.getMonth() + 1, d),
      isCurrentMonth: false,
      isToday: false
    })
  }

  // 本月的天数
  const today = formatDate(new Date())
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, i)
    const dateStr = formatDate(date)
    days.push({
      day: i,
      date: dateStr,
      lunar: getLunar(currentYear.value, currentMonth.value, i),
      isCurrentMonth: true,
      isToday: dateStr === today
    })
  }

  // 下月的天数（补齐6行）
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    days.push({
      day: i,
      date: formatDate(date),
      lunar: getLunar(date.getFullYear(), date.getMonth() + 1, i),
      isCurrentMonth: false,
      isToday: false
    })
  }

  return days
})

// 选中日期的文本
const selectedDateText = computed(() => {
  const d = new Date(selectedDate.value)
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDay}`
})

// 选中日期的日记
const selectedDateDiaries = computed(() => {
  const currentDate = normalizeDateValue(selectedDate.value)
  return diaries.value.filter(e => normalizeDateValue(e.eventDate) === currentDate)
})

const currentMonthDiaryCount = computed(() => diaries.value.length)

const todayPendingReminder = computed(() => {
  const today = formatDate(new Date())
  return [...reminders.value]
    .filter((reminder) => reminder.status === 1 && normalizeDateValue(reminder.remindTime) === today)
    .sort((a, b) => (a.remindTime || '').localeCompare(b.remindTime || ''))[0] || null
})
const monthDiaryDetails = computed(() => [...diaries.value].sort((a, b) => `${b.eventDate} ${b.eventTime || ''}`.localeCompare(`${a.eventDate} ${a.eventTime || ''}`)))
const pendingReminderDetails = computed(() => [...reminders.value].sort((a, b) => (a.remindTime || '').localeCompare(b.remindTime || '')))
const selectedDiaryDetailsForDialog = computed(() => [...selectedDateDiaries.value].sort((a, b) => `${b.eventDate} ${b.eventTime || ''}`.localeCompare(`${a.eventDate} ${a.eventTime || ''}`)))
const detailDialogTitle = computed(() => {
  if (detailDialogType.value === 'month') return `${currentYear.value}年${currentMonth.value}月记录详情`
  if (detailDialogType.value === 'reminder') return '待发送提醒详情'
  return `${selectedDateText.value} 详情`
})
const detailDialogSummary = computed(() => {
  if (detailDialogType.value === 'month') return `当前共 ${monthDiaryDetails.value.length} 篇记录`
  if (detailDialogType.value === 'reminder') return `当前共 ${pendingReminderDetails.value.length} 条待发送提醒`
  return `当前选中日期共 ${selectedDiaryDetailsForDialog.value.length} 篇记录`
})

// 选中的通知方式是否未实现
const selectedMethodNotImplemented = computed(() => {
  const method = notificationMethods.value.find(m => m.code === reminderForm.value.notificationType)
  return method?.implStatus === 0
})

// 工具函数
function formatDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateValue(value?: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (value.includes('T')) return value.slice(0, 10)
  if (value.includes(' ')) return value.slice(0, 10)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return formatDate(date)
}

function formatDateTime(dt: string | undefined) {
  if (!dt) return '-'
  const d = new Date(dt)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatCreateTime(dt: string | undefined) {
  if (!dt) return ''
  const d = new Date(dt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatNotificationTime(dt: string) {
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getDaysInfo(date: string) {
  if (!date) return ''
  const target = new Date(normalizeDateValue(date))
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

function hasDiary(date: string) {
  const targetDate = normalizeDateValue(date)
  return diaries.value.some(e => normalizeDateValue(e.eventDate) === targetDate)
}

function getDiaryCount(date: string) {
  const targetDate = normalizeDateValue(date)
  return diaries.value.filter(e => normalizeDateValue(e.eventDate) === targetDate).length
}

function getEventTypeText(type: number) {
  const texts: Record<number, string> = { 1: '待办', 2: '日记', 3: '纪念日' }
  return texts[type] || '日记'
}

function getEventTagType(type: number) {
  const types: Record<number, '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'primary',
    2: 'success',
    3: 'warning'
  }
  return types[type] || 'success'
}

function getReminderStatusText(status: number) {
  const texts: Record<number, string> = { 1: '待发送', 2: '已发送', 3: '发送失败' }
  return texts[status] || '待发送'
}

function getReminderStatusType(status: number) {
  const types: Record<number, '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return types[status] || 'warning'
}

// 导航
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const goToday = () => {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth() + 1
  selectedDate.value = formatDate(today)
}

const goBack = () => {
  router.push('/index/miniapp')
}

const openDetailDialog = (type: 'month' | 'reminder' | 'selected') => {
  detailDialogType.value = type
  detailDialogVisible.value = true
}

const selectDate = (day: any) => {
  selectedDate.value = day.date
  if (!day.isCurrentMonth) {
    const d = new Date(day.date)
    currentYear.value = d.getFullYear()
    currentMonth.value = d.getMonth() + 1
  }
}

// 日记相关
const showDiaryDialog = (diary?: CalendarEvent) => {
  if (diary) {
    isEditDiary.value = true
    diaryForm.value = { ...diary }
  } else {
    isEditDiary.value = false
    diaryForm.value = {
      title: '',
      content: '',
      eventDate: selectedDate.value,
      eventTime: '',
      eventType: 2,
      priority: 2,
      mood: ''
    }
  }
  diaryDialogVisible.value = true
}

const handleSaveDiary = async () => {
  if (!diaryForm.value.title) {
    message.warning('请输入标题')
    return
  }
  if (!diaryForm.value.eventDate) {
    message.warning('请选择日期')
    return
  }

  let success = false
  if (isEditDiary.value && diaryForm.value.id) {
    success = await updateEvent(diaryForm.value)
  } else {
    success = await createEvent(diaryForm.value)
  }

  if (success) {
    diaryDialogVisible.value = false
    loadDiaries()
  }
}

const handleDeleteDiary = async (id: number) => {
  if (!(await confirm({ message: '确定删除这篇日记吗？', confirmText: '删除' }))) return
  const success = await deleteEvent(id)
  if (success) loadDiaries()
}

// 提醒相关
const showReminderDialog = () => {
  reminderForm.value = {
    title: '',
    remindTime: '',
    notificationType: 'app'
  }
  reminderDialogVisible.value = true
}

const handleSaveReminder = async () => {
  if (!reminderForm.value.title) {
    message.warning('请输入提醒标题')
    return
  }
  if (reminderForm.value.title!.length > 20) {
    message.warning('标题不能超过20个字')
    return
  }
  if (!reminderForm.value.remindTime) {
    message.warning('请选择提醒时间')
    return
  }

  if (selectedMethodNotImplemented.value) {
    message.warning('该通知方式尚未实现，请选择其他方式或继续保存')
  }

  const success = await createReminder(reminderForm.value as Reminder)
  if (success) {
    reminderDialogVisible.value = false
    loadReminders()
  }
}

// 通知相关
const dismissNotification = async () => {
  if (currentNotification.value) {
    await markNotificationAsRead(currentNotification.value.id)
    pendingNotifications.value = pendingNotifications.value.filter(n => n.id !== currentNotification.value!.id)
    showNextNotification()
  }
}

const showNextNotification = () => {
  if (pendingNotifications.value.length > 0) {
    currentNotification.value = pendingNotifications.value[0]
  } else {
    currentNotification.value = null
  }
}

// 加载数据
const loadDiaries = async () => {
  diaryLoading.value = true
  diaries.value = await getMonthEvents(currentYear.value, currentMonth.value)
  diaryLoading.value = false
}

const loadReminders = async () => {
  reminderLoading.value = true
  const list = await getReminderList()
  reminders.value = list.filter(r => r.status === 1)
  reminderLoading.value = false
}

const loadNotificationMethods = async () => {
  notificationMethods.value = await getNotificationMethods()
}

const loadPendingNotifications = async () => {
  pendingNotifications.value = await getPendingNotifications()
  showNextNotification()
}

// 定时检查通知
let notificationTimer: number | null = null

// 监听月份变化
watch([currentYear, currentMonth], () => {
  loadDiaries()
})

onMounted(() => {
  loadDiaries()
  loadReminders()
  loadNotificationMethods()
  loadPendingNotifications()

  // 每分钟检查一次待显示的通知
  notificationTimer = window.setInterval(() => {
    loadPendingNotifications()
  }, 60000)
})

onUnmounted(() => {
  if (notificationTimer) {
    clearInterval(notificationTimer)
  }
})
</script>

<style scoped lang="scss">
.calendar-container {
  height: 100%;
  min-height: 100%;
  padding: 12px 16px 16px;
  background:
    radial-gradient(circle at top left, rgba(255, 186, 73, 0.12), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #eef3fb 100%);
  position: relative;
  overflow: hidden;
}

.workspace-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 100%;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.back-button {
  color: #64748b;
}

.page-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #94a3b8;
}

.page-title {
  margin: 2px 0 0;
  font-size: 24px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    color: #f59e0b;
  }
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 106px;
  padding: 8px 12px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.stat-chip-button {
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: #93c5fd;
    background: #f8fbff;
    transform: translateY(-1px);
  }
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
}

.stat-value {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;

  :deep(.header-action-button.el-button) {
    min-width: 84px;
    padding: 8px 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    white-space: nowrap;
    text-align: center;
  }
}

.notification-bar {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: rgba(35, 46, 74, 0.95);
  color: white;
  padding: 12px 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);

  .notification-content {
    display: flex;
    align-items: center;
    gap: 10px;

    .el-icon {
      font-size: 20px;
    }

    .notification-title {
      font-weight: 600;
      font-size: 16px;
    }

    .notification-time {
      font-size: 14px;
      opacity: 0.9;
    }
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateX(-50%) translateY(-100%);
  opacity: 0;
}

.calendar-stage {
  min-height: 0;
  flex: 1;
}

.calendar-panel {
  height: 100%;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.calendar-panel {
  :deep(.el-card__body) {
    height: 100%;
    padding: 16px 18px;
  }
}

.calendar-stage-inner {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(240px, 288px);
  gap: 16px;
  align-items: stretch;
}

.calendar-board {
  min-width: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0;
}

.calendar-sidepanel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-card {
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
}

.date-card {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-color: #fed7aa;
}

.date-card-button {
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;

  &:hover {
    border-color: #fdba74;
    box-shadow: 0 10px 24px rgba(249, 115, 22, 0.12);
  }
}

.side-caption {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.side-date {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.35;
}

.side-helper {
  margin-top: 6px;
  color: #f59e0b;
  font-weight: 600;
}

.side-count {
  margin-top: 14px;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: #475569;

  strong {
    font-size: 24px;
    color: #0f172a;
  }
}

.side-card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-weight: 700;
}

.side-card-text {
  margin-top: 10px;
  color: #0f172a;
  font-weight: 600;
  line-height: 1.45;
}

.side-card-meta {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.side-card-muted {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.calendar-board {
  .month-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
  }

  .month-title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .month-caption {
    font-size: 12px;
    color: #94a3b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .month-title {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
  }

  .month-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .calendar-grid {
    min-height: 0;
    display: grid;
    grid-template-rows: auto 1fr;
    .weekday-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 8px;

      .weekday {
        text-align: center;
        font-weight: 600;
        color: #64748b;
        padding: 6px 0;
      }
    }

    .day-grid {
      min-height: 0;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: repeat(6, minmax(0, 1fr));
      gap: 6px;

      .day-cell {
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        padding: 8px 8px 6px;
        background: #f8fafc;
        border: 1px solid transparent;

        &:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        &.other-month {
          .day-number, .lunar-text {
            color: #c0c4cc;
          }
        }

        &.today {
          background: #fff7ed;

          .day-number {
            color: #f59e0b;
            font-weight: 700;
          }
        }

        &.selected {
          background: linear-gradient(135deg, #f59e0b 0%, #fb923c 100%);
          box-shadow: 0 10px 24px rgba(249, 115, 22, 0.28);

          .day-number, .lunar-text, .day-badge {
            color: white;
          }

          .day-badge {
            background: rgba(255, 255, 255, 0.2);
          }
        }

        &.has-diary {
          .diary-dot {
            display: block;
          }
        }

        .day-topline {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .day-number {
          font-size: 15px;
          color: #1f2937;
          font-weight: 600;
        }

        .day-badge {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #fff;
          color: #f97316;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .lunar-text {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 6px;
        }

        .diary-dot {
          display: none;
          position: absolute;
          bottom: 5px;
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
        }
      }
    }
  }
}

.calendar-container :deep(.el-card),
.calendar-container :deep(.el-dialog) {
  overflow: hidden;
}

.mood-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  .mood-option {
    font-size: 24px;
    cursor: pointer;
    padding: 5px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: #f5f7fa;
      transform: scale(1.1);
    }

    &.active {
      background: #fff7e6;
      box-shadow: 0 0 0 2px #f5af19;
    }
  }
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.notification-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.detail-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-dialog-summary {
  font-size: 14px;
  color: #64748b;
}

.detail-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.detail-item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-item-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.detail-item-meta {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.detail-item-sub {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  color: #f59e0b;
}

.detail-item-content {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1440px) {
  .calendar-stage-inner {
    grid-template-columns: minmax(0, 1fr) 260px;
  }
}

@media (max-width: 1200px) {
  .calendar-container {
    height: auto;
    overflow: visible;
  }

  .workspace-shell {
    height: auto;
  }

  .calendar-stage-inner {
    grid-template-columns: 1fr;
    height: auto;
  }

  .calendar-panel {
    height: auto;
  }

  .calendar-panel :deep(.el-card__body) {
    height: auto;
  }
}

@media (max-width: 768px) {
  .calendar-container {
    padding: 12px;
  }

  .page-title {
    font-size: 26px;
  }

  .workspace-header {
    padding: 16px;
  }

  .header-main,
  .header-actions,
  .header-stats {
    width: 100%;
  }

  .header-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .calendar-panel :deep(.el-card__body) {
    padding: 16px;
  }

  .calendar-board .month-nav {
    flex-direction: column;
    align-items: flex-start;
  }

  .calendar-board .month-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .calendar-board .day-grid {
    gap: 6px;
  }

  .calendar-board .day-grid .day-cell {
    min-height: 72px;
    padding: 8px;
  }

  .side-date {
    font-size: 22px;
  }
}
</style>
