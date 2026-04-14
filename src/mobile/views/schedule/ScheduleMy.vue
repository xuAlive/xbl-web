<template>
  <div class="schedule-my">
    <!-- 周选择器 -->
    <div class="week-selector">
      <el-icon @click="prevWeek"><ArrowLeft /></el-icon>
      <span class="week-text">{{ weekRangeText }}</span>
      <el-icon @click="nextWeek"><ArrowRight /></el-icon>
      <span class="today-btn" @click="goToday">今天</span>
    </div>

    <!-- 排班列表 -->
    <div class="schedule-list" v-loading="loading">
      <div
        v-for="day in weekDays"
        :key="day.date"
        class="schedule-day"
        :class="{ today: isToday(day.date), weekend: isWeekend(day.date) }"
      >
        <div class="day-info">
          <span class="day-name">{{ day.dayName }}</span>
          <span class="day-date">{{ day.dateStr }}</span>
        </div>
        <div class="shift-info" :class="getShiftClass(day.date)">
          <template v-if="getSchedule(day.date)">
            <span class="shift-name">{{ getSchedule(day.date)?.shiftName }}</span>
            <span class="shift-time" v-if="getShiftTime(day.date)">{{ getShiftTime(day.date) }}</span>
            <el-tag v-if="getSchedule(day.date)?.status !== 1" size="small" :type="getStatusType(getSchedule(day.date)?.status)">
              {{ getStatusText(getSchedule(day.date)?.status) }}
            </el-tag>
          </template>
          <span v-else class="no-shift">休息</span>
        </div>
      </div>

      <el-empty v-if="!loading && schedules.length === 0" description="本周暂无排班" />
    </div>

    <!-- 班次图例 -->
    <div class="legend-section" v-if="shifts.length > 0">
      <div class="legend-title">班次说明</div>
      <div class="legend-items">
        <div class="legend-item" v-for="shift in shifts" :key="shift.id">
          <span class="legend-dot" :style="{ background: shift.color }"></span>
          <span class="legend-name">{{ shift.shiftName }}</span>
          <span class="legend-time">{{ shift.startTime }} - {{ shift.endTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { getShiftList, getMySchedules, type Shift, type Schedule } from '../../api/schedule'

const loading = ref(false)
const currentWeekStart = ref(getMonday(new Date()))
const shifts = ref<Shift[]>([])
const schedules = ref<Schedule[]>([])

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function formatDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const weekDays = computed(() => {
  const days = []
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)
    days.push({
      date: formatDate(date),
      dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
      dayName: dayNames[i]
    })
  }
  return days
})

const weekRangeText = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
})

const isToday = (date: string) => date === formatDate(new Date())
const isWeekend = (date: string) => {
  const d = new Date(date)
  return d.getDay() === 0 || d.getDay() === 6
}

const getSchedule = (date: string) => {
  return schedules.value.find(s => s.scheduleDate === date)
}

const getShiftTime = (date: string) => {
  const schedule = getSchedule(date)
  if (!schedule) return ''
  const shift = shifts.value.find(s => s.id === schedule.shiftId)
  return shift ? `${shift.startTime} - ${shift.endTime}` : ''
}

const getShiftClass = (date: string) => {
  const schedule = getSchedule(date)
  if (!schedule) return 'shift-rest'
  const shiftName = schedule.shiftName || ''
  if (shiftName.includes('早') || shiftName.includes('上午')) return 'shift-morning'
  if (shiftName.includes('午') || shiftName.includes('中')) return 'shift-noon'
  if (shiftName.includes('晚') || shiftName.includes('夜')) return 'shift-night'
  return 'shift-default'
}

const getStatusText = (status: number | undefined) => {
  const map: Record<number, string> = { 2: '请假', 3: '调休', 4: '加班' }
  return status ? map[status] : ''
}

const getStatusType = (status: number | undefined) => {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    2: 'warning',
    3: 'info',
    4: 'danger'
  }
  return status ? map[status] || 'info' : 'info'
}

const prevWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = date
  loadSchedules()
}

const nextWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = date
  loadSchedules()
}

const goToday = () => {
  currentWeekStart.value = getMonday(new Date())
  loadSchedules()
}

const loadShifts = async () => {
  shifts.value = await getShiftList()
}

const loadSchedules = async () => {
  loading.value = true
  const startDate = formatDate(currentWeekStart.value)
  const end = new Date(currentWeekStart.value)
  end.setDate(end.getDate() + 6)
  const endDate = formatDate(end)
  schedules.value = await getMySchedules(startDate, endDate)
  loading.value = false
}

onMounted(() => {
  loadShifts()
  loadSchedules()
})
</script>

<style scoped lang="scss">
.schedule-my {
  padding: 15px;
}

.week-selector {
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

  .week-text {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    min-width: 150px;
    text-align: center;
  }

  .today-btn {
    font-size: 14px;
    color: #409EFF;
    cursor: pointer;
  }
}

.schedule-list {
  .schedule-day {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &.today {
      border-left: 4px solid #409EFF;
    }

    &.weekend {
      background: #fafafa;
    }

    .day-info {
      min-width: 60px;
      text-align: center;

      .day-name {
        display: block;
        font-size: 14px;
        color: #666;
      }

      .day-date {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-top: 4px;
      }
    }

    .shift-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 15px;
      margin-left: 15px;
      border-radius: 8px;
      background: #f5f5f5;

      &.shift-morning {
        background: linear-gradient(90deg, #FFD700 0%, #FFF8DC 100%);
        .shift-name { color: #8B6914; }
      }

      &.shift-noon {
        background: linear-gradient(90deg, #FF6B35 0%, #FFE4D1 100%);
        .shift-name { color: #CC4400; }
      }

      &.shift-night {
        background: linear-gradient(90deg, #E74C3C 0%, #FADBD8 100%);
        .shift-name { color: #A93226; }
      }

      &.shift-rest {
        background: #f0f0f0;
      }

      &.shift-default {
        background: linear-gradient(90deg, #667eea 0%, #E8E8FF 100%);
        .shift-name { color: #4338ca; }
      }

      .shift-name {
        font-size: 16px;
        font-weight: 600;
      }

      .shift-time {
        font-size: 12px;
        color: #666;
      }

      .no-shift {
        color: #999;
        font-size: 14px;
      }
    }
  }
}

.legend-section {
  margin-top: 15px;
  padding: 15px;
  background: #fff;
  border-radius: 12px;

  .legend-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  }

  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-name {
      color: #333;
    }

    .legend-time {
      color: #999;
    }
  }
}
</style>
