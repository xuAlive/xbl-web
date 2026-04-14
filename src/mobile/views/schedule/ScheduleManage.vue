<template>
  <div class="schedule-manage">
    <!-- 视图切换和月份导航 -->
    <div class="view-header">
      <div class="month-nav">
        <el-icon @click="prevPeriod"><ArrowLeft /></el-icon>
        <span class="period-text">{{ periodText }}</span>
        <el-icon @click="nextPeriod"><ArrowRight /></el-icon>
      </div>
      <div class="view-toggle">
        <span :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">周</span>
        <span :class="{ active: viewMode === 'month' }" @click="viewMode = 'month'">月</span>
      </div>
    </div>

    <!-- 星期标题 -->
    <div class="week-header">
      <span v-for="day in weekDays" :key="day" class="week-day">{{ day }}</span>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid" :class="viewMode" v-loading="loading">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="calendar-cell"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'weekend': day.isWeekend
        }"
        @click="handleDayClick(day)"
      >
        <div class="day-header">
          <span class="day-num">{{ day.day }}</span>
        </div>
        <div class="day-schedules">
          <div
            v-for="schedule in getDaySchedules(day.date)"
            :key="schedule.id"
            class="schedule-tag"
            :style="{ background: getShiftColor(schedule.shiftId) }"
            @click.stop="editSchedule(schedule)"
          >
            {{ schedule.employeeName?.charAt(0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 排班列表（选中日期） -->
    <div class="schedule-section" v-if="selectedDate">
      <div class="section-header">
        <span class="section-title">{{ formatSelectedDate }} 排班</span>
        <el-button type="primary" size="small" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加
        </el-button>
      </div>
      <div class="schedule-list" v-if="selectedSchedules.length > 0">
        <div
          v-for="schedule in selectedSchedules"
          :key="schedule.id"
          class="schedule-item"
        >
          <div class="schedule-color" :style="{ background: getShiftColor(schedule.shiftId) }"></div>
          <div class="schedule-info">
            <span class="emp-name">{{ schedule.employeeName }}</span>
            <span class="shift-name">{{ schedule.shiftName }}</span>
          </div>
          <div class="schedule-actions">
            <el-button type="primary" link size="small" @click="editSchedule(schedule)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(schedule)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      <div class="no-schedule" v-else>
        <span>暂无排班</span>
      </div>
    </div>

    <!-- 添加/编辑排班对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑排班' : '添加排班'"
      width="90%"
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="日期">
          <el-input :value="form.scheduleDate" disabled />
        </el-form-item>
        <el-form-item label="员工" required>
          <el-select v-model="form.account" placeholder="请选择员工" style="width: 100%">
            <el-option
              v-for="emp in employees"
              :key="emp.employeeCode"
              :label="emp.employeeName"
              :value="emp.employeeCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班次" required>
          <el-select v-model="form.shiftId" placeholder="请选择班次" style="width: 100%">
            <el-option
              v-for="shift in shifts"
              :key="shift.id"
              :label="`${shift.shiftName} (${shift.startTime}-${shift.endTime})`"
              :value="shift.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowLeft, ArrowRight, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { confirm } from '@/shared/ui/confirm'
import {
  getShiftList, getScheduleList, getEmployeeList,
  createSchedule, updateSchedule, deleteSchedule,
  type Shift, type Schedule, type Employee
} from '../../api/schedule'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const viewMode = ref<'week' | 'month'>('week')
const currentDate = ref(new Date())
const selectedDate = ref(formatDate(new Date()))

const shifts = ref<Shift[]>([])
const schedules = ref<Schedule[]>([])
const employees = ref<Employee[]>([])

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const form = ref<Partial<Schedule>>({
  scheduleDate: '',
  account: '',
  shiftId: undefined,
  remark: ''
})

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

const periodText = computed(() => {
  if (viewMode.value === 'week') {
    const monday = getMonday(currentDate.value)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`
  } else {
    return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
  }
})

const calendarDays = computed(() => {
  const days: any[] = []
  const today = formatDate(new Date())

  if (viewMode.value === 'week') {
    const monday = getMonday(currentDate.value)
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(date.getDate() + i)
      const dateStr = formatDate(date)
      days.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isWeekend: i === 0 || i === 6
      })
    }
  } else {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const firstDayWeek = firstDay.getDay()
    const prevMonthDays = firstDayWeek
    const prevMonth = month === 0 ? 12 : month
    const prevYear = month === 0 ? year - 1 : year
    const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate()

    // 上月
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        year: prevYear, month: prevMonth, day, date: dateStr,
        isCurrentMonth: false, isToday: dateStr === today,
        isWeekend: days.length % 7 === 0 || days.length % 7 === 6
      })
    }

    // 当月
    const currentMonthDays = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= currentMonthDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayOfWeek = (firstDayWeek + day - 1) % 7
      days.push({
        year, month: month + 1, day, date: dateStr,
        isCurrentMonth: true, isToday: dateStr === today,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      })
    }

    // 补齐6行
    const remaining = 42 - days.length
    const nextMonth = month === 11 ? 1 : month + 2
    const nextYear = month === 11 ? year + 1 : year
    for (let day = 1; day <= remaining; day++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        year: nextYear, month: nextMonth, day, date: dateStr,
        isCurrentMonth: false, isToday: dateStr === today,
        isWeekend: days.length % 7 === 0 || days.length % 7 === 6
      })
    }
  }

  return days
})

const selectedSchedules = computed(() => {
  return schedules.value.filter(s => s.scheduleDate === selectedDate.value)
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const prevPeriod = () => {
  if (viewMode.value === 'week') {
    currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 7))
  } else {
    currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1))
  }
  loadSchedules()
}

const nextPeriod = () => {
  if (viewMode.value === 'week') {
    currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 7))
  } else {
    currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1))
  }
  loadSchedules()
}

const getDaySchedules = (date: string) => {
  return schedules.value.filter(s => s.scheduleDate === date)
}

const getShiftColor = (shiftId: number) => {
  const shift = shifts.value.find(s => s.id === shiftId)
  return shift?.color || '#409EFF'
}

const handleDayClick = (day: any) => {
  selectedDate.value = day.date
}

const showAddDialog = () => {
  isEdit.value = false
  form.value = {
    scheduleDate: selectedDate.value,
    account: '',
    shiftId: undefined,
    remark: ''
  }
  dialogVisible.value = true
}

const editSchedule = (schedule: Schedule) => {
  isEdit.value = true
  form.value = { ...schedule }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.account || !form.value.shiftId) return

  // 获取员工名和班次名
  const emp = employees.value.find(e => e.employeeCode === form.value.account)
  const shift = shifts.value.find(s => s.id === form.value.shiftId)
  form.value.employeeName = emp?.employeeName
  form.value.shiftName = shift?.shiftName

  submitting.value = true
  try {
    let success = false
    if (isEdit.value) {
      success = await updateSchedule(form.value as Schedule)
    } else {
      success = await createSchedule(form.value)
    }

    if (success) {
      dialogVisible.value = false
      loadSchedules()
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (schedule: Schedule) => {
  if (!(await confirm({ message: `确定删除 ${schedule.employeeName} 的排班吗？`, confirmText: '删除' }))) return

  const success = await deleteSchedule(schedule.id!)
  if (success) {
    loadSchedules()
  }
}

const loadSchedules = async () => {
  loading.value = true
  let startDate: string, endDate: string

  if (viewMode.value === 'week') {
    const monday = getMonday(currentDate.value)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    startDate = formatDate(monday)
    endDate = formatDate(sunday)
  } else {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`
  }

  schedules.value = await getScheduleList(startDate, endDate)
  loading.value = false
}

watch(viewMode, () => {
  loadSchedules()
})

onMounted(async () => {
  shifts.value = await getShiftList()
  employees.value = await getEmployeeList()
  loadSchedules()
})
</script>

<style scoped lang="scss">
.schedule-manage {
  padding: 15px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px 15px;
  margin-bottom: 15px;

  .month-nav {
    display: flex;
    align-items: center;
    gap: 12px;

    .el-icon {
      font-size: 18px;
      color: #666;
      cursor: pointer;
    }

    .period-text {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      min-width: 120px;
      text-align: center;
    }
  }

  .view-toggle {
    display: flex;
    background: #f5f5f5;
    border-radius: 20px;
    padding: 3px;

    span {
      padding: 6px 16px;
      font-size: 13px;
      color: #666;
      border-radius: 18px;
      cursor: pointer;

      &.active {
        background: #667eea;
        color: #fff;
      }
    }
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

    &:first-child, &:last-child {
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

  &.week {
    .calendar-cell {
      min-height: 80px;
    }
  }

  &.month {
    .calendar-cell {
      min-height: 60px;
    }
  }

  .calendar-cell {
    padding: 5px;
    cursor: pointer;
    border: 1px solid transparent;

    &.other-month {
      .day-num {
        color: #ccc;
      }
    }

    &.today {
      .day-num {
        background: #667eea;
        color: #fff;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &.weekend:not(.other-month) {
      .day-num {
        color: #F56C6C;
      }
    }

    &:hover {
      background: #f5f5f5;
    }

    .day-header {
      .day-num {
        font-size: 14px;
        color: #333;
      }
    }

    .day-schedules {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-top: 4px;

      .schedule-tag {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        color: #fff;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

.schedule-section {
  margin-top: 15px;
  background: #fff;
  border-radius: 12px;
  padding: 15px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }

  .schedule-list {
    .schedule-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f8f8;
      border-radius: 10px;
      margin-bottom: 10px;

      .schedule-color {
        width: 4px;
        height: 36px;
        border-radius: 2px;
      }

      .schedule-info {
        flex: 1;

        .emp-name {
          display: block;
          font-size: 15px;
          font-weight: 500;
          color: #333;
        }

        .shift-name {
          font-size: 13px;
          color: #999;
        }
      }

      .schedule-actions {
        display: flex;
        gap: 5px;
      }
    }
  }

  .no-schedule {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 14px;
  }
}
</style>
