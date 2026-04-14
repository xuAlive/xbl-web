<template>
  <div class="diary-calendar">
    <!-- 月份导航 -->
    <div class="month-nav">
      <el-icon @click="prevMonth"><ArrowLeft /></el-icon>
      <span class="month-text" @click="showMonthPicker = true">
        {{ currentYear }}年{{ currentMonth }}月
      </span>
      <el-icon @click="nextMonth"><ArrowRight /></el-icon>
      <span class="today-btn" @click="goToday">今天</span>
    </div>

    <!-- 星期标题 -->
    <div class="week-header">
      <span v-for="day in weekDays" :key="day" class="week-day">{{ day }}</span>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid" v-loading="loading">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="calendar-cell"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'has-event': day.hasEvent,
          'weekend': day.isWeekend
        }"
        @click="handleDayClick(day)"
      >
        <span class="solar-day">{{ day.day }}</span>
        <span class="lunar-day" :class="{ 'term': day.isTerm }">{{ day.lunarStr }}</span>
        <span class="event-dot" v-if="day.hasEvent"></span>
      </div>
    </div>

    <!-- 当日事件列表 -->
    <div class="event-section" v-if="selectedDate">
      <div class="event-header">
        <span class="event-date">{{ formatSelectedDate }}</span>
        <el-button type="primary" size="small" round @click="addEvent">
          <el-icon><Plus /></el-icon>
          写日记
        </el-button>
      </div>
      <div class="event-list" v-if="selectedEvents.length > 0">
        <div
          v-for="event in selectedEvents"
          :key="event.id"
          class="event-item"
          :class="getEventClass(event)"
          @click="viewEvent(event)"
        >
          <span class="event-mood" v-if="event.mood">{{ event.mood }}</span>
          <div class="event-content">
            <span class="event-title">{{ event.title }}</span>
            <span class="event-type">{{ getEventTypeText(event.eventType) }}</span>
          </div>
          <el-icon class="event-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="no-event" v-else>
        <span>这天还没有记录</span>
        <el-button type="primary" link @click="addEvent">写点什么吧</el-button>
      </div>
    </div>

    <!-- 月份选择器 -->
    <el-dialog v-model="showMonthPicker" title="选择月份" width="90%">
      <div class="month-picker">
        <div class="year-nav">
          <el-icon @click="pickerYear--"><ArrowLeft /></el-icon>
          <span>{{ pickerYear }}年</span>
          <el-icon @click="pickerYear++"><ArrowRight /></el-icon>
        </div>
        <div class="month-grid">
          <span
            v-for="m in 12"
            :key="m"
            class="month-item"
            :class="{ active: currentYear === pickerYear && currentMonth === m }"
            @click="selectMonth(m)"
          >{{ m }}月</span>
        </div>
      </div>
    </el-dialog>

    <!-- 事件详情弹窗 -->
    <el-dialog v-model="showEventDetail" :title="currentEvent?.title" width="90%">
      <div class="event-detail" v-if="currentEvent">
        <div class="detail-row">
          <span class="label">日期</span>
          <span class="value">{{ currentEvent.eventDate }}</span>
        </div>
        <div class="detail-row" v-if="currentEvent.mood">
          <span class="label">心情</span>
          <span class="value mood">{{ currentEvent.mood }}</span>
        </div>
        <div class="detail-row">
          <span class="label">类型</span>
          <span class="value">{{ getEventTypeText(currentEvent.eventType) }}</span>
        </div>
        <div class="detail-content" v-if="currentEvent.content">
          <span class="label">内容</span>
          <div class="content-text">{{ currentEvent.content }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showEventDetail = false">关闭</el-button>
        <el-button type="danger" @click="handleDeleteEvent">删除</el-button>
        <el-button type="primary" @click="editEvent">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Plus } from '@element-plus/icons-vue'
import { confirm } from '@/shared/ui/confirm'
import { getMonthEvents, deleteEvent, type CalendarEvent } from '../../api/calendar'
import { getLunarDayStr, solar2lunar } from '../../utils/lunar'

const router = useRouter()

const loading = ref(false)
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const selectedDate = ref(formatDate(new Date()))
const events = ref<CalendarEvent[]>([])

const showMonthPicker = ref(false)
const pickerYear = ref(currentYear.value)

const showEventDetail = ref(false)
const currentEvent = ref<CalendarEvent | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

interface CalendarDay {
  year: number
  month: number
  day: number
  date: string
  lunarStr: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isTerm: boolean
  hasEvent: boolean
}

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const today = formatDate(new Date())

  // 当月第一天
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const firstDayWeek = firstDay.getDay()

  // 上月需要显示的天数
  const prevMonthDays = firstDayWeek
  const prevMonth = currentMonth.value === 1 ? 12 : currentMonth.value - 1
  const prevYear = currentMonth.value === 1 ? currentYear.value - 1 : currentYear.value
  const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate()

  // 添加上月日期
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const lunar = solar2lunar(prevYear, prevMonth, day)
    days.push({
      year: prevYear,
      month: prevMonth,
      day,
      date,
      lunarStr: getLunarDayStr(prevYear, prevMonth, day),
      isCurrentMonth: false,
      isToday: date === today,
      isWeekend: days.length % 7 === 0 || days.length % 7 === 6,
      isTerm: lunar?.isTerm || false,
      hasEvent: events.value.some(e => e.eventDate === date)
    })
  }

  // 当月天数
  const currentMonthDays = new Date(currentYear.value, currentMonth.value, 0).getDate()

  // 添加当月日期
  for (let day = 1; day <= currentMonthDays; day++) {
    const date = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayOfWeek = (firstDayWeek + day - 1) % 7
    const lunar = solar2lunar(currentYear.value, currentMonth.value, day)
    days.push({
      year: currentYear.value,
      month: currentMonth.value,
      day,
      date,
      lunarStr: getLunarDayStr(currentYear.value, currentMonth.value, day),
      isCurrentMonth: true,
      isToday: date === today,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isTerm: lunar?.isTerm || false,
      hasEvent: events.value.some(e => e.eventDate === date)
    })
  }

  // 补齐下月日期（6行 * 7列 = 42）
  const remaining = 42 - days.length
  const nextMonth = currentMonth.value === 12 ? 1 : currentMonth.value + 1
  const nextYear = currentMonth.value === 12 ? currentYear.value + 1 : currentYear.value

  for (let day = 1; day <= remaining; day++) {
    const date = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const lunar = solar2lunar(nextYear, nextMonth, day)
    days.push({
      year: nextYear,
      month: nextMonth,
      day,
      date,
      lunarStr: getLunarDayStr(nextYear, nextMonth, day),
      isCurrentMonth: false,
      isToday: date === today,
      isWeekend: days.length % 7 === 0 || days.length % 7 === 6,
      isTerm: lunar?.isTerm || false,
      hasEvent: events.value.some(e => e.eventDate === date)
    })
  }

  return days
})

const selectedEvents = computed(() => {
  return events.value.filter(e => e.eventDate === selectedDate.value)
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  const lunar = solar2lunar(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDayNames[d.getDay()]} ${lunar?.monthCn}${lunar?.dayCn}`
})

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadEvents()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadEvents()
}

const goToday = () => {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth() + 1
  selectedDate.value = formatDate(today)
  loadEvents()
}

const selectMonth = (m: number) => {
  currentYear.value = pickerYear.value
  currentMonth.value = m
  showMonthPicker.value = false
  loadEvents()
}

const handleDayClick = (day: CalendarDay) => {
  selectedDate.value = day.date
  if (!day.isCurrentMonth) {
    currentYear.value = day.year
    currentMonth.value = day.month
    loadEvents()
  }
}

const addEvent = () => {
  router.push(`/diary?date=${selectedDate.value}`)
}

const viewEvent = (event: CalendarEvent) => {
  currentEvent.value = event
  showEventDetail.value = true
}

const editEvent = () => {
  if (currentEvent.value?.id) {
    showEventDetail.value = false
    router.push(`/diary/edit/${currentEvent.value.id}`)
  }
}

const handleDeleteEvent = async () => {
  if (!currentEvent.value?.id) return

  if (!(await confirm({ message: '确定删除这条记录吗？', confirmText: '删除' }))) return

  const success = await deleteEvent(currentEvent.value.id)
  if (success) {
    showEventDetail.value = false
    loadEvents()
  }
}

const getEventTypeText = (type: number) => {
  const map: Record<number, string> = { 1: '待办', 2: '日记', 3: '纪念日' }
  return map[type] || '其他'
}

const getEventClass = (event: CalendarEvent) => {
  const map: Record<number, string> = { 1: 'type-todo', 2: 'type-diary', 3: 'type-anniversary' }
  return map[event.eventType] || ''
}

const loadEvents = async () => {
  loading.value = true
  events.value = await getMonthEvents(currentYear.value, currentMonth.value)
  loading.value = false
}

watch(showMonthPicker, (val) => {
  if (val) {
    pickerYear.value = currentYear.value
  }
})

onMounted(() => {
  loadEvents()
})
</script>

<style scoped lang="scss">
.diary-calendar {
  padding: 15px;
  padding-bottom: 20px;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 15px;

  .el-icon {
    font-size: 18px;
    color: #666;
    cursor: pointer;
  }

  .month-text {
    font-size: 17px;
    font-weight: 600;
    color: #333;
    min-width: 100px;
    text-align: center;
    cursor: pointer;
  }

  .today-btn {
    font-size: 14px;
    color: #F56C6C;
    cursor: pointer;
  }
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fff;
  border-radius: 12px 12px 0 0;
  padding: 10px 0;

  .week-day {
    text-align: center;
    font-size: 13px;
    color: #666;

    &:first-child,
    &:last-child {
      color: #F56C6C;
    }
  }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fff;
  border-radius: 0 0 12px 12px;
  padding-bottom: 10px;

  .calendar-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    cursor: pointer;
    min-height: 55px;

    &.other-month {
      .solar-day,
      .lunar-day {
        color: #ccc;
      }
    }

    &.today {
      .solar-day {
        background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
        color: #fff;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &.weekend:not(.other-month) {
      .solar-day {
        color: #F56C6C;
      }
    }

    &.has-event {
      .event-dot {
        display: block;
      }
    }

    .solar-day {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }

    .lunar-day {
      font-size: 10px;
      color: #999;
      margin-top: 2px;

      &.term {
        color: #67C23A;
        font-weight: 500;
      }
    }

    .event-dot {
      display: none;
      position: absolute;
      bottom: 4px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #F56C6C;
    }
  }
}

.event-section {
  margin-top: 15px;
  background: #fff;
  border-radius: 12px;
  padding: 15px;

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .event-date {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }

  .event-list {
    .event-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f8f8;
      border-radius: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      border-left: 3px solid #ddd;

      &.type-diary {
        border-left-color: #F56C6C;
        background: #fff5f5;
      }

      &.type-todo {
        border-left-color: #409EFF;
        background: #f0f9ff;
      }

      &.type-anniversary {
        border-left-color: #E6A23C;
        background: #fef8e7;
      }

      .event-mood {
        font-size: 24px;
      }

      .event-content {
        flex: 1;

        .event-title {
          display: block;
          font-size: 15px;
          color: #333;
        }

        .event-type {
          font-size: 12px;
          color: #999;
        }
      }

      .event-arrow {
        color: #ccc;
      }
    }
  }

  .no-event {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 14px;

    .el-button {
      margin-left: 5px;
    }
  }
}

.month-picker {
  .year-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;

    span {
      font-size: 18px;
      font-weight: 600;
    }

    .el-icon {
      font-size: 18px;
      cursor: pointer;
      color: #666;
    }
  }

  .month-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;

    .month-item {
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 15px;

      &:hover {
        background: #eee;
      }

      &.active {
        background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
        color: #fff;
      }
    }
  }
}

.event-detail {
  .detail-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    .label {
      width: 60px;
      color: #999;
      font-size: 14px;
    }

    .value {
      flex: 1;
      color: #333;
      font-size: 14px;

      &.mood {
        font-size: 24px;
      }
    }
  }

  .detail-content {
    padding-top: 12px;

    .label {
      display: block;
      color: #999;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .content-text {
      color: #333;
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-wrap;
    }
  }
}
</style>
