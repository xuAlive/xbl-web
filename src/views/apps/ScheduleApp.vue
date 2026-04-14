<template>
  <div class="schedule-container">
    <!-- 顶部导航 -->
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button @click="goBack" icon="ArrowLeft" text>返回</el-button>
          <h2 class="page-title">
            <el-icon><Calendar /></el-icon>
            排班管理系统
          </h2>
        </div>
        <div class="header-right">
          <el-radio-group v-model="activeTab" size="default">
            <el-radio-button label="schedule">排班管理</el-radio-button>
            <el-radio-button v-if="isAdmin" label="employee">员工管理</el-radio-button>
            <el-radio-button v-if="isAdmin" label="statistics">统计报表</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <!-- 排班管理 Tab -->
    <template v-if="activeTab === 'schedule'">
      <!-- 日期选择 -->
      <el-card class="date-card">
        <div class="date-selector">
          <el-button @click="prevWeek" icon="ArrowLeft" circle />
          <div class="week-display">
            <span class="week-range">{{ weekRangeText }}</span>
            <el-button type="primary" link @click="goToday">今天</el-button>
          </div>
          <el-button @click="nextWeek" icon="ArrowRight" circle />
          <el-button type="success" @click="handleMonthlyExport" icon="Download" style="margin-left: 20px;">导出月排班</el-button>
          <el-button v-if="isAdmin" type="primary" @click="showCreateDialog" icon="Plus">添加排班</el-button>
        </div>
      </el-card>

      <!-- 排班表格 -->
      <el-card class="schedule-card" v-loading="loading">
        <div class="schedule-table">
          <table>
            <thead>
              <tr>
                <th class="employee-header">员工</th>
                <th v-for="day in weekDays" :key="day.date"
                    :class="{ today: isToday(day.date), weekend: isWeekend(day.date) }">
                  <div class="day-header">
                    <span class="day-name">{{ day.dayName }}</span>
                    <span class="day-date">{{ day.dateStr }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="employee in displayEmployees" :key="employee.employeeCode">
                <td class="employee-cell">
                  <el-avatar :size="32">{{ employee.employeeName?.charAt(0) }}</el-avatar>
                  <span class="employee-name">{{ employee.employeeName }}</span>
                </td>
                <td v-for="day in weekDays" :key="day.date"
                    :class="['schedule-cell', getShiftClass(employee.employeeCode, day.date), { today: isToday(day.date), weekend: isWeekend(day.date) }]"
                    @click="isAdmin && handleCellClick(employee, day.date)">
                  <div class="shift-cell" @click.stop="isAdmin && editSchedule(getSchedule(employee.employeeCode, day.date))">
                    <template v-if="getSchedule(employee.employeeCode, day.date)">
                      <span class="shift-name">{{ getSchedule(employee.employeeCode, day.date)?.shiftName }}</span>
                      <span class="status-badge" v-if="getSchedule(employee.employeeCode, day.date)?.status !== 1">
                        {{ getStatusText(getSchedule(employee.employeeCode, day.date)?.status) }}
                      </span>
                    </template>
                    <el-button v-else type="primary" link size="small" class="add-btn">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                  </div>
                </td>
              </tr>
              <tr v-if="displayEmployees.length === 0">
                <td :colspan="8" class="empty-cell">
                  <el-empty description="暂无员工数据，请先添加员工" :image-size="80" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-card>

      <!-- 班次图例 -->
      <el-card class="legend-card">
        <div class="legend-title">班次颜色说明</div>
        <div class="legend-list">
          <div class="legend-item">
            <div class="legend-color shift-morning-demo"></div>
            <span class="legend-text">早班 (上三分之一黄色)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color shift-noon-demo"></div>
            <span class="legend-text">午班 (中间三分之一橙红色)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color shift-night-demo"></div>
            <span class="legend-text">晚班 (下三分之一红色)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color shift-rest-demo"></div>
            <span class="legend-text">休息 (黑色背景)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color shift-none-demo"></div>
            <span class="legend-text">未排班 (白色背景)</span>
          </div>
        </div>
        <div class="shift-time-list" v-if="shifts.length">
          <div class="time-title">班次时间</div>
          <div class="time-items">
            <span v-for="shift in shifts" :key="shift.id" class="time-item">
              {{ shift.shiftName }}: {{ shift.startTime }} - {{ shift.endTime }}
            </span>
          </div>
        </div>
      </el-card>
    </template>

    <!-- 员工管理 Tab -->
    <template v-if="activeTab === 'employee'">
      <el-card class="employee-card">
        <div class="employee-toolbar">
          <div class="toolbar-left">
            <el-input v-model="employeeKeyword" placeholder="搜索员工姓名/工号" clearable style="width: 200px;" @input="loadEmployeePage" />
            <el-select v-model="employeeDeptFilter" placeholder="选择部门" clearable style="width: 150px; margin-left: 10px;" @change="loadEmployeePage">
              <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
            </el-select>
          </div>
          <el-button type="primary" @click="showEmployeeDialog()" icon="Plus">添加员工</el-button>
        </div>

        <el-table :data="employeeList" v-loading="employeeLoading" style="width: 100%; margin-top: 15px;">
          <el-table-column prop="employeeCode" label="员工编号" width="120" />
          <el-table-column prop="employeeName" label="员工姓名" width="120" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="position" label="职位" width="120" />
          <el-table-column prop="phone" label="联系电话" width="140" />
          <el-table-column prop="email" label="邮箱" min-width="180" />
          <el-table-column prop="entryDate" label="入职日期" width="120" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
                {{ row.status === 1 ? '在职' : row.status === 2 ? '离职' : '休假' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showEmployeeDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDeleteEmployee(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="employeePage"
          v-model:page-size="employeePageSize"
          :total="employeeTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          style="margin-top: 15px; justify-content: flex-end;"
          @size-change="loadEmployeePage"
          @current-change="loadEmployeePage"
        />
      </el-card>
    </template>

    <!-- 统计报表 Tab -->
    <template v-if="activeTab === 'statistics'">
      <el-card class="statistics-card">
        <div class="statistics-toolbar">
          <el-radio-group v-model="statsPeriod" @change="loadStatistics">
            <el-radio-button value="week">本周</el-radio-button>
            <el-radio-button value="month">本月</el-radio-button>
            <el-radio-button value="quarter">本季度</el-radio-button>
            <el-radio-button value="year">本年</el-radio-button>
          </el-radio-group>
          <el-select v-model="statsEmployee" placeholder="全部员工" clearable style="margin-left: 15px; width: 150px;" @change="loadStatistics">
            <el-option v-for="emp in allEmployees" :key="emp.employeeCode" :label="emp.employeeName" :value="emp.employeeCode" />
          </el-select>
          <el-button type="success" @click="handleExport" icon="Download" style="margin-left: 15px;">导出报表</el-button>
        </div>

        <!-- 统计概览 -->
        <div class="stats-overview" v-if="statistics">
          <div class="stats-item">
            <div class="stats-value">{{ statistics.totalCount }}</div>
            <div class="stats-label">排班次数</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">{{ statistics.totalHours }}</div>
            <div class="stats-label">总工时(小时)</div>
          </div>
          <div class="stats-item">
            <div class="stats-value">{{ statistics.employeeStats?.length || 0 }}</div>
            <div class="stats-label">参与人数</div>
          </div>
          <div class="stats-item period-desc">
            <div class="stats-value">{{ statistics.periodDesc }}</div>
            <div class="stats-label">{{ statistics.startDate }} ~ {{ statistics.endDate }}</div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-container">
          <div class="chart-box">
            <div class="chart-title">班次分布 (饼图)</div>
            <div ref="pieChartRef" class="chart"></div>
          </div>
          <div class="chart-box">
            <div class="chart-title">状态分布 (饼图)</div>
            <div ref="statusPieRef" class="chart"></div>
          </div>
          <div class="chart-box wide">
            <div class="chart-title">员工工时统计 (柱状图)</div>
            <div ref="barChartRef" class="chart"></div>
          </div>
        </div>

        <!-- 员工明细表 -->
        <div class="employee-stats-table" v-if="statistics?.employeeStats?.length">
          <div class="table-title">员工排班明细</div>
          <el-table :data="statistics.employeeStats" style="width: 100%">
            <el-table-column prop="employeeName" label="员工姓名" width="120" />
            <el-table-column prop="scheduleCount" label="排班次数" width="100" />
            <el-table-column prop="workHours" label="工时(小时)" width="100" />
            <el-table-column prop="normalCount" label="正常" width="80" />
            <el-table-column prop="leaveCount" label="请假" width="80" />
            <el-table-column prop="adjustCount" label="调休" width="80" />
            <el-table-column prop="overtimeCount" label="加班" width="80" />
          </el-table>
        </div>
      </el-card>
    </template>

    <!-- 创建/编辑排班对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑排班' : '添加排班'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="员工">
          <el-select v-model="form.account" placeholder="选择员工" style="width: 100%;" @change="onEmployeeChange">
            <el-option
              v-for="emp in allEmployees"
              :key="emp.employeeCode"
              :label="emp.employeeName"
              :value="emp.employeeCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="form.scheduleDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="form.shiftId" placeholder="选择班次" style="width: 100%">
            <el-option
              v-for="shift in shifts"
              :key="shift.id"
              :label="shift.shiftName"
              :value="shift.id"
            >
              <div class="shift-option">
                <span :style="{ color: shift.color }">●</span>
                <span>{{ shift.shiftName }}</span>
                <span class="shift-option-time">{{ shift.startTime }} - {{ shift.endTime }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
            <el-option :value="1" label="正常" />
            <el-option :value="2" label="请假" />
            <el-option :value="3" label="调休" />
            <el-option :value="4" label="加班" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="isEdit" type="danger" @click="handleDelete">删除</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 员工编辑对话框 -->
    <el-dialog
      v-model="employeeDialogVisible"
      :title="isEditEmployee ? '编辑员工' : '添加员工'"
      width="500px"
    >
      <el-form :model="employeeForm" label-width="80px">
        <el-form-item label="员工编号" required>
          <el-input v-model="employeeForm.employeeCode" placeholder="请输入员工编号" :disabled="isEditEmployee" />
        </el-form-item>
        <el-form-item label="员工姓名" required>
          <el-input v-model="employeeForm.employeeName" placeholder="请输入员工姓名" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="employeeForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="employeeForm.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="employeeForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="employeeForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="入职日期">
          <el-date-picker
            v-model="employeeForm.entryDate"
            type="date"
            placeholder="选择入职日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="employeeForm.status" placeholder="选择状态" style="width: 100%">
            <el-option :value="1" label="在职" />
            <el-option :value="2" label="离职" />
            <el-option :value="3" label="休假" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="employeeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEmployeeSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, Plus, ArrowLeft, ArrowRight, Download } from '@element-plus/icons-vue'
import { message } from '@/shared/ui/feedback'
import { confirm } from '@/shared/ui/confirm'
import { loadEcharts, type EChartsModule } from '../../shared/utils/echarts'
import { getAccount, getUserRoleCode } from '../../utils/userInfo'
import {
  getShiftList,
  getScheduleList,
  getMySchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getEmployeeList,
  getEmployeePage,
  getDepartments,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getQuarterlyStatistics,
  getYearlyStatistics,
  exportStatistics,
  exportMonthlyCalendar,
  type Shift,
  type Schedule,
  type Employee,
  type ScheduleStatistics
} from '../../api/schedule'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const activeTab = ref('schedule')
const currentAccount = getAccount()
const isAdmin = getUserRoleCode() === 'ADMIN'

// 当前周的起始日期
const currentWeekStart = ref(getMonday(new Date()))

// 班次列表
const shifts = ref<Shift[]>([])

// 排班数据
const schedules = ref<Schedule[]>([])

// 所有员工（用于选择）
const allEmployees = ref<Employee[]>([])

// 表单数据
const form = ref({
  id: undefined as number | undefined,
  account: '',
  employeeName: '',
  scheduleDate: '',
  shiftId: undefined as number | undefined,
  shiftName: '',
  status: 1,
  remark: ''
})

// 员工管理相关
const employeeLoading = ref(false)
const employeeDialogVisible = ref(false)
const isEditEmployee = ref(false)
const employeeList = ref<Employee[]>([])
const employeePage = ref(1)
const employeePageSize = ref(10)
const employeeTotal = ref(0)
const employeeKeyword = ref('')
const employeeDeptFilter = ref('')
const departments = ref<string[]>([])
const employeeForm = ref<Employee>({
  employeeCode: '',
  employeeName: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  entryDate: '',
  status: 1
})

// 统计相关
const statsPeriod = ref('month')
const statsEmployee = ref('')
const statistics = ref<ScheduleStatistics | null>(null)
const pieChartRef = ref<HTMLDivElement>()
const statusPieRef = ref<HTMLDivElement>()
const barChartRef = ref<HTMLDivElement>()
let echartsLib: EChartsModule | null = null
let pieChart: ReturnType<EChartsModule['init']> | null = null
let statusPieChart: ReturnType<EChartsModule['init']> | null = null
let barChart: ReturnType<EChartsModule['init']> | null = null

const ensureEcharts = async () => {
  echartsLib ??= await loadEcharts()
  return echartsLib
}

// 计算本周日期
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

// 周范围文本
const weekRangeText = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
})

// 显示的员工列表
const displayEmployees = computed(() => {
  return isAdmin
    ? allEmployees.value.filter(e => e.status === 1)
    : allEmployees.value.filter(e => e.status === 1 && e.employeeCode === currentAccount)
})

// 获取指定员工指定日期的排班
const getSchedule = (account: string, date: string) => {
  const schedule = schedules.value.find(s =>
    s.account === account && s.scheduleDate === date
  )
  if (schedule) {
    const shift = shifts.value.find(sh => sh.id === schedule.shiftId)
    return {
      ...schedule,
      color: shift?.color || '#409eff'
    }
  }
  return null
}

// 获取周一
function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

// 格式化日期
function formatDate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 是否是今天
const isToday = (date: string) => date === formatDate(new Date())

// 是否是周末
const isWeekend = (date: string) => {
  const d = new Date(date)
  return d.getDay() === 0 || d.getDay() === 6
}

// 状态文本
const getStatusText = (status: number | undefined) => {
  const map: Record<number, string> = {
    2: '请假',
    3: '调休',
    4: '加班'
  }
  return status ? map[status] : ''
}

// 根据班次获取样式类名
const getShiftClass = (account: string, date: string) => {
  const schedule = getSchedule(account, date)
  if (!schedule) return 'shift-none'

  const shiftName = schedule.shiftName || ''
  if (shiftName.includes('早') || shiftName.includes('上午')) return 'shift-morning'
  if (shiftName.includes('午') || shiftName.includes('中')) return 'shift-noon'
  if (shiftName.includes('晚') || shiftName.includes('夜')) return 'shift-night'
  if (shiftName.includes('休') || shiftName.includes('假')) return 'shift-rest'

  return 'shift-default'
}

// 上一周
const prevWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = date
  loadSchedules()
}

// 下一周
const nextWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = date
  loadSchedules()
}

// 回到今天
const goToday = () => {
  currentWeekStart.value = getMonday(new Date())
  loadSchedules()
}

// 返回
const goBack = () => {
  router.push('/index/miniapp')
}

// 显示创建对话框
const showCreateDialog = () => {
  if (!isAdmin) return
  isEdit.value = false
  form.value = {
    id: undefined,
    account: '',
    employeeName: '',
    scheduleDate: formatDate(new Date()),
    shiftId: undefined,
    shiftName: '',
    status: 1,
    remark: ''
  }
  dialogVisible.value = true
}

// 员工选择变化
const onEmployeeChange = (account: string) => {
  const emp = allEmployees.value.find(e => e.employeeCode === account)
  if (emp) {
    form.value.employeeName = emp.employeeName
  }
}

// 点击单元格
const handleCellClick = (employee: Employee, date: string) => {
  if (!isAdmin) return
  const schedule = getSchedule(employee.employeeCode, date)
  if (schedule) {
    editSchedule(schedule)
  } else {
    isEdit.value = false
    form.value = {
      id: undefined,
      account: employee.employeeCode,
      employeeName: employee.employeeName,
      scheduleDate: date,
      shiftId: undefined,
      shiftName: '',
      status: 1,
      remark: ''
    }
    dialogVisible.value = true
  }
}

// 编辑排班
const editSchedule = (schedule: any) => {
  if (!isAdmin || !schedule) return
  isEdit.value = true
  form.value = {
    id: schedule.id,
    account: schedule.account,
    employeeName: schedule.employeeName,
    scheduleDate: schedule.scheduleDate,
    shiftId: schedule.shiftId,
    shiftName: schedule.shiftName,
    status: schedule.status,
    remark: schedule.remark || ''
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!isAdmin) {
    message.warning('普通用户只有查看权限')
    return
  }
  if (!form.value.account || !form.value.scheduleDate || !form.value.shiftId) {
    message.warning('请填写完整信息')
    return
  }

  const shift = shifts.value.find(s => s.id === form.value.shiftId)
  const data: Schedule = {
    ...form.value,
    shiftName: shift?.shiftName || ''
  }

  let success = false
  if (isEdit.value && form.value.id) {
    success = await updateSchedule(data)
  } else {
    success = await createSchedule(data)
  }

  if (success) {
    dialogVisible.value = false
    loadSchedules()
  }
}

// 删除排班
const handleDelete = async () => {
  if (!isAdmin) return
  if (!form.value.id) return

  if (!(await confirm({ message: '确定删除该排班记录吗？', confirmText: '删除' }))) return

  const success = await deleteSchedule(form.value.id)
  if (success) {
    dialogVisible.value = false
    loadSchedules()
  }
}

// 加载班次
const loadShifts = async () => {
  shifts.value = await getShiftList()
}

// 加载排班
const loadSchedules = async () => {
  loading.value = true
  const startDate = formatDate(currentWeekStart.value)
  const end = new Date(currentWeekStart.value)
  end.setDate(end.getDate() + 6)
  const endDate = formatDate(end)

  schedules.value = isAdmin
    ? await getScheduleList(startDate, endDate)
    : await getMySchedules(startDate, endDate)

  if (!isAdmin) {
    const ownName = schedules.value[0]?.employeeName || '我的排班'
    allEmployees.value = [{
      employeeCode: currentAccount,
      employeeName: ownName,
      status: 1
    }]
  }
  loading.value = false
}

// 加载所有员工
const loadAllEmployees = async () => {
  if (!isAdmin) {
    allEmployees.value = []
    return
  }
  allEmployees.value = await getEmployeeList()
}

// ==================== 员工管理 ====================

// 加载员工分页
const loadEmployeePage = async () => {
  if (!isAdmin) return
  employeeLoading.value = true
  const result = await getEmployeePage(employeePage.value, employeePageSize.value, employeeDeptFilter.value, employeeKeyword.value)
  employeeList.value = result.records || []
  employeeTotal.value = result.total || 0
  employeeLoading.value = false
}

// 加载部门列表
const loadDepartments = async () => {
  if (!isAdmin) return
  departments.value = await getDepartments()
}

// 显示员工对话框
const showEmployeeDialog = (emp?: Employee) => {
  if (!isAdmin) return
  if (emp) {
    isEditEmployee.value = true
    employeeForm.value = { ...emp }
  } else {
    isEditEmployee.value = false
    employeeForm.value = {
      employeeCode: '',
      employeeName: '',
      department: '',
      position: '',
      phone: '',
      email: '',
      entryDate: '',
      status: 1
    }
  }
  employeeDialogVisible.value = true
}

// 提交员工表单
const handleEmployeeSubmit = async () => {
  if (!isAdmin) return
  if (!employeeForm.value.employeeCode || !employeeForm.value.employeeName) {
    message.warning('请填写员工编号和姓名')
    return
  }

  let success = false
  if (isEditEmployee.value) {
    success = await updateEmployee(employeeForm.value)
  } else {
    success = await createEmployee(employeeForm.value)
  }

  if (success) {
    employeeDialogVisible.value = false
    loadEmployeePage()
    loadAllEmployees()
    loadDepartments()
  }
}

// 删除员工
const handleDeleteEmployee = async (id: number) => {
  if (!isAdmin) return
  if (!(await confirm({ message: '确定删除该员工吗？', confirmText: '删除' }))) return
  const success = await deleteEmployee(id)
  if (success) {
    loadEmployeePage()
    loadAllEmployees()
  }
}

// ==================== 统计报表 ====================

// 加载统计数据
const loadStatistics = async () => {
  if (!isAdmin) return
  let data: ScheduleStatistics | null = null
  const account = statsEmployee.value || undefined

  switch (statsPeriod.value) {
    case 'week':
      data = await getWeeklyStatistics(account)
      break
    case 'month':
      data = await getMonthlyStatistics(account)
      break
    case 'quarter':
      data = await getQuarterlyStatistics(account)
      break
    case 'year':
      data = await getYearlyStatistics(account)
      break
  }

  statistics.value = data
  await nextTick()
  await renderCharts()
}

// 渲染图表
const renderCharts = async () => {
  if (!statistics.value) return
  const echarts = await ensureEcharts()

  // 班次分布饼图
  if (pieChartRef.value) {
    if (!pieChart) {
      pieChart = echarts.init(pieChartRef.value)
    }
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 10 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: statistics.value.shiftStats?.map(item => ({
          name: item.name,
          value: item.value
        })) || []
      }]
    })
  }

  // 状态分布饼图
  if (statusPieRef.value) {
    if (!statusPieChart) {
      statusPieChart = echarts.init(statusPieRef.value)
    }
    const colors = { '正常': '#67C23A', '请假': '#E6A23C', '调休': '#909399', '加班': '#F56C6C' }
    statusPieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 10 },
      series: [{
        type: 'pie',
        radius: '60%',
        data: statistics.value.statusStats?.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: colors[item.name as keyof typeof colors] || '#409EFF' }
        })) || []
      }]
    })
  }

  // 员工工时柱状图
  if (barChartRef.value) {
    if (!barChart) {
      barChart = echarts.init(barChartRef.value)
    }
    const empStats = statistics.value.employeeStats || []
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['工时', '排班次数'] },
      xAxis: {
        type: 'category',
        data: empStats.map(e => e.employeeName),
        axisLabel: { rotate: 30 }
      },
      yAxis: [
        { type: 'value', name: '工时(小时)' },
        { type: 'value', name: '次数' }
      ],
      series: [
        {
          name: '工时',
          type: 'bar',
          data: empStats.map(e => e.workHours),
          itemStyle: { color: '#409EFF' }
        },
        {
          name: '排班次数',
          type: 'bar',
          yAxisIndex: 1,
          data: empStats.map(e => e.scheduleCount),
          itemStyle: { color: '#67C23A' }
        }
      ]
    })
  }
}

// 导出报表
const handleExport = () => {
  if (!isAdmin) return
  if (!statistics.value) {
    message.warning('请先加载统计数据')
    return
  }
  exportStatistics(statistics.value.startDate, statistics.value.endDate, statsEmployee.value || undefined)
}

const handleMonthlyExport = () => {
  const exportDate = new Date(currentWeekStart.value)
  const year = exportDate.getFullYear()
  const month = exportDate.getMonth() + 1
  exportMonthlyCalendar(year, month, isAdmin ? undefined : currentAccount)
}

// 监听 tab 切换
watch(activeTab, (newTab) => {
  if (!isAdmin && newTab !== 'schedule') {
    activeTab.value = 'schedule'
    return
  }
  if (newTab === 'employee') {
    loadEmployeePage()
    loadDepartments()
  } else if (newTab === 'statistics') {
    loadStatistics()
  }
})

// 监听窗口大小变化，重新渲染图表
const handleResize = () => {
  pieChart?.resize()
  statusPieChart?.resize()
  barChart?.resize()
}

onMounted(() => {
  loadShifts()
  loadSchedules()
  if (isAdmin) {
    loadAllEmployees()
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  statusPieChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped lang="scss">
.schedule-container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  overflow-y: auto;
}

.header-card {
  margin-bottom: 20px;
  border-radius: 12px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .page-title {
    margin: 0;
    font-size: 24px;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      color: #667eea;
    }
  }
}

.date-card {
  margin-bottom: 20px;
  border-radius: 12px;

  .date-selector {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;

    .week-display {
      text-align: center;

      .week-range {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin-right: 10px;
      }
    }
  }
}

.schedule-card {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;

  .schedule-table {
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        border: 1px solid #ebeef5;
        padding: 12px;
        text-align: center;
        min-width: 100px;
      }

      th {
        background: #f5f7fa;
        font-weight: 600;

        &.today {
          background: #ecf5ff;
        }

        &.weekend {
          background: #fef0f0;
        }

        .day-header {
          .day-name {
            display: block;
            font-size: 14px;
            color: #606266;
          }

          .day-date {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }

      td {
        &.today {
          background: #f0f9ff;
        }

        &.weekend {
          background: #fff5f5;
        }
      }

      .employee-header {
        min-width: 120px;
      }

      .employee-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: flex-start;
        padding-left: 20px;

        .employee-name {
          font-weight: 500;
        }
      }

      .shift-cell {
        min-height: 60px;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;

        .shift-name {
          font-size: 12px;
          font-weight: 600;
          color: #303133;
          z-index: 1;
        }

        .status-badge {
          font-size: 10px;
          color: #e6a23c;
          margin-top: 2px;
          z-index: 1;
        }

        .add-btn {
          opacity: 0.3;

          &:hover {
            opacity: 1;
          }
        }
      }

      // 班次颜色样式
      .schedule-cell {
        padding: 0 !important;
        position: relative;
        transition: all 0.2s;

        &:hover {
          opacity: 0.85;
          transform: scale(1.02);
        }

        // 未排班 - 白色
        &.shift-none {
          background: #fff;
        }

        // 早班 - 上三分之一黄色
        &.shift-morning {
          background: linear-gradient(to bottom,
            #FFD700 0%,
            #FFD700 33.33%,
            #fff 33.33%,
            #fff 100%);

          .shift-name {
            color: #8B6914;
          }
        }

        // 午班 - 中间三分之一橙红色
        &.shift-noon {
          background: linear-gradient(to bottom,
            #fff 0%,
            #fff 33.33%,
            #FF6B35 33.33%,
            #FF6B35 66.66%,
            #fff 66.66%,
            #fff 100%);

          .shift-name {
            color: #CC4400;
          }
        }

        // 晚班 - 下三分之一红色
        &.shift-night {
          background: linear-gradient(to bottom,
            #fff 0%,
            #fff 66.66%,
            #E74C3C 66.66%,
            #E74C3C 100%);

          .shift-name {
            color: #A93226;
          }
        }

        // 休息 - 黑色背景
        &.shift-rest {
          background: #2C3E50;

          .shift-name {
            color: #fff;
          }

          .status-badge {
            color: #F39C12;
          }
        }

        // 默认/其他班次
        &.shift-default {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

          .shift-name {
            color: #fff;
          }
        }
      }

      .empty-cell {
        padding: 40px;
      }
    }
  }
}

.legend-card {
  border-radius: 12px;

  .legend-title {
    font-weight: 600;
    margin-bottom: 15px;
    color: #303133;
  }

  .legend-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .legend-color {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        border: 1px solid #ebeef5;
      }

      .shift-morning-demo {
        background: linear-gradient(to bottom, #FFD700 0%, #FFD700 33.33%, #fff 33.33%, #fff 100%);
      }

      .shift-noon-demo {
        background: linear-gradient(to bottom, #fff 0%, #fff 33.33%, #FF6B35 33.33%, #FF6B35 66.66%, #fff 66.66%, #fff 100%);
      }

      .shift-night-demo {
        background: linear-gradient(to bottom, #fff 0%, #fff 66.66%, #E74C3C 66.66%, #E74C3C 100%);
      }

      .shift-rest-demo {
        background: #2C3E50;
      }

      .shift-none-demo {
        background: #fff;
      }

      .legend-text {
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .shift-time-list {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #ebeef5;

    .time-title {
      font-weight: 500;
      color: #909399;
      margin-bottom: 10px;
      font-size: 13px;
    }

    .time-items {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;

      .time-item {
        font-size: 12px;
        color: #606266;
        background: #f5f7fa;
        padding: 4px 10px;
        border-radius: 4px;
      }
    }
  }
}

.shift-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .shift-option-time {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
  }
}

// 员工管理样式
.employee-card {
  border-radius: 12px;

  .employee-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .toolbar-left {
      display: flex;
      align-items: center;
    }
  }
}

// 统计报表样式
.statistics-card {
  border-radius: 12px;

  .statistics-toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  .stats-overview {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;

    .stats-item {
      text-align: center;
      color: #fff;

      .stats-value {
        font-size: 32px;
        font-weight: 700;
      }

      .stats-label {
        font-size: 14px;
        opacity: 0.9;
        margin-top: 5px;
      }

      &.period-desc {
        margin-left: auto;
        text-align: right;

        .stats-value {
          font-size: 20px;
        }
      }
    }
  }

  .charts-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 30px;

    .chart-box {
      flex: 1;
      min-width: 300px;
      background: #f5f7fa;
      border-radius: 12px;
      padding: 15px;

      &.wide {
        flex: 2;
        min-width: 600px;
      }

      .chart-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #303133;
      }

      .chart {
        height: 300px;
      }
    }
  }

  .employee-stats-table {
    .table-title {
      font-weight: 600;
      margin-bottom: 15px;
      color: #303133;
    }
  }
}
</style>
