import { $get, $post } from "../utils/request"
import { message } from '@/shared/ui/feedback'
import { getScheduleBaseURL } from '@/shared/config/runtime'

/**
 * 班次接口
 */
export interface Shift {
  id: number
  shiftCode: string
  shiftName: string
  startTime: string
  endTime: string
  color: string
  description: string
  status: number
}

/**
 * 排班记录接口
 */
export interface Schedule {
  id?: number
  account: string
  employeeName: string
  scheduleDate: string
  shiftId: number
  shiftName: string
  status: number  // 1-正常 2-请假 3-调休 4-加班
  remark?: string
}

/**
 * 员工接口
 */
export interface Employee {
  id?: number
  employeeCode: string
  employeeName: string
  department?: string
  position?: string
  phone?: string
  email?: string
  entryDate?: string
  status: number  // 1-在职 2-离职 3-休假
}

/**
 * 统计图表项
 */
export interface ChartItem {
  name: string
  value: number
}

/**
 * 员工统计项
 */
export interface EmployeeStatItem {
  account: string
  employeeName: string
  scheduleCount: number
  workHours: number
  normalCount: number
  leaveCount: number
  adjustCount: number
  overtimeCount: number
}

/**
 * 日期统计项
 */
export interface DateStatItem {
  date: string
  count: number
}

/**
 * 统计数据接口
 */
export interface ScheduleStatistics {
  periodType: string
  periodDesc: string
  startDate: string
  endDate: string
  totalCount: number
  totalHours: number
  shiftStats: ChartItem[]
  statusStats: ChartItem[]
  employeeStats: EmployeeStatItem[]
  dateStats: DateStatItem[]
}

/**
 * 获取班次列表
 */
export const getShiftList = async () => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/shift/list', {})
    if (ret.code === 1) {
      return ret.data as Shift[]
    } else {
      message.error(ret.codeMessage || '获取班次列表失败')
      return []
    }
  } catch (error) {
    console.error('获取班次列表失败:', error)
    message.error('获取班次列表失败')
    return []
  }
}

/**
 * 获取排班列表
 */
export const getScheduleList = async (startDate: string, endDate: string) => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/schedule/list', { startDate, endDate })
    if (ret.code === 1) {
      return ret.data as Schedule[]
    } else {
      message.error(ret.codeMessage || '获取排班列表失败')
      return []
    }
  } catch (error) {
    console.error('获取排班列表失败:', error)
    message.error('获取排班列表失败')
    return []
  }
}

/**
 * 获取我的排班
 */
export const getMySchedules = async (startDate: string, endDate: string) => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/schedule/my', { startDate, endDate })
    if (ret.code === 1) {
      return ret.data as Schedule[]
    } else {
      message.error(ret.codeMessage || '获取排班失败')
      return []
    }
  } catch (error) {
    console.error('获取排班失败:', error)
    message.error('获取排班失败')
    return []
  }
}

/**
 * 创建排班
 */
export const createSchedule = async (schedule: Schedule) => {
  try {
    const ret = await $post(getScheduleBaseURL() + '/schedule/create', schedule)
    if (ret.code === 1) {
      message.success('创建成功')
      return true
    } else {
      message.error(ret.codeMessage || '创建失败')
      return false
    }
  } catch (error) {
    console.error('创建排班失败:', error)
    message.error('创建排班失败')
    return false
  }
}

/**
 * 批量创建排班
 */
export const batchCreateSchedules = async (schedules: Schedule[]) => {
  try {
    const ret = await $post(getScheduleBaseURL() + '/schedule/batchCreate', schedules)
    if (ret.code === 1) {
      message.success('批量创建成功')
      return true
    } else {
      message.error(ret.codeMessage || '批量创建失败')
      return false
    }
  } catch (error) {
    console.error('批量创建排班失败:', error)
    message.error('批量创建排班失败')
    return false
  }
}

/**
 * 更新排班
 */
export const updateSchedule = async (schedule: Schedule) => {
  try {
    const ret = await $post(getScheduleBaseURL() + '/schedule/update', schedule)
    if (ret.code === 1) {
      message.success('更新成功')
      return true
    } else {
      message.error(ret.codeMessage || '更新失败')
      return false
    }
  } catch (error) {
    console.error('更新排班失败:', error)
    message.error('更新排班失败')
    return false
  }
}

/**
 * 删除排班
 */
export const deleteSchedule = async (id: number) => {
  try {
    const ret = await $post(getScheduleBaseURL() + `/schedule/delete`, { id })
    if (ret.code === 1) {
      message.success('删除成功')
      return true
    } else {
      message.error(ret.codeMessage || '删除失败')
      return false
    }
  } catch (error) {
    console.error('删除排班失败:', error)
    message.error('删除排班失败')
    return false
  }
}

// ==================== 员工管理 API ====================

/**
 * 获取在职员工列表
 */
export const getEmployeeList = async () => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/employee/list', {})
    if (ret.code === 1) {
      return ret.data as Employee[]
    } else {
      message.error(ret.codeMessage || '获取员工列表失败')
      return []
    }
  } catch (error) {
    console.error('获取员工列表失败:', error)
    message.error('获取员工列表失败')
    return []
  }
}

/**
 * 分页查询员工
 */
export const getEmployeePage = async (page: number, size: number, department?: string, keyword?: string) => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/employee/page', { page, size, department, keyword })
    if (ret.code === 1) {
      return ret.data
    } else {
      message.error(ret.codeMessage || '获取员工列表失败')
      return { records: [], total: 0 }
    }
  } catch (error) {
    console.error('获取员工列表失败:', error)
    message.error('获取员工列表失败')
    return { records: [], total: 0 }
  }
}

/**
 * 获取所有部门
 */
export const getDepartments = async () => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/employee/departments', {})
    if (ret.code === 1) {
      return ret.data as string[]
    }
    return []
  } catch (error) {
    console.error('获取部门列表失败:', error)
    return []
  }
}

/**
 * 创建员工
 */
export const createEmployee = async (employee: Employee) => {
  try {
    const ret = await $post(getScheduleBaseURL() + '/employee/create', employee)
    if (ret.code === 1) {
      message.success('创建成功')
      return true
    } else {
      message.error(ret.codeMessage || '创建失败')
      return false
    }
  } catch (error) {
    console.error('创建员工失败:', error)
    message.error('创建员工失败')
    return false
  }
}

/**
 * 更新员工
 */
export const updateEmployee = async (employee: Employee) => {
  try {
    const ret = await $post(getScheduleBaseURL() + '/employee/update', employee)
    if (ret.code === 1) {
      message.success('更新成功')
      return true
    } else {
      message.error(ret.codeMessage || '更新失败')
      return false
    }
  } catch (error) {
    console.error('更新员工失败:', error)
    message.error('更新员工失败')
    return false
  }
}

/**
 * 删除员工
 */
export const deleteEmployee = async (id: number) => {
  try {
    const ret = await $post(getScheduleBaseURL() + `/employee/delete`, { id })
    if (ret.code === 1) {
      message.success('删除成功')
      return true
    } else {
      message.error(ret.codeMessage || '删除失败')
      return false
    }
  } catch (error) {
    console.error('删除员工失败:', error)
    message.error('删除员工失败')
    return false
  }
}

// ==================== 统计报表 API ====================

/**
 * 获取周统计
 */
export const getWeeklyStatistics = async (account?: string, date?: string) => {
  try {
    const params: any = {}
    if (account) params.account = account
    if (date) params.date = date
    const ret = await $get(getScheduleBaseURL() + '/statistics/weekly', params)
    if (ret.code === 1) {
      return ret.data as ScheduleStatistics
    }
    return null
  } catch (error) {
    console.error('获取周统计失败:', error)
    return null
  }
}

/**
 * 获取月统计
 */
export const getMonthlyStatistics = async (account?: string, year?: number, month?: number) => {
  try {
    const params: any = {}
    if (account) params.account = account
    if (year) params.year = year
    if (month) params.month = month
    const ret = await $get(getScheduleBaseURL() + '/statistics/monthly', params)
    if (ret.code === 1) {
      return ret.data as ScheduleStatistics
    }
    return null
  } catch (error) {
    console.error('获取月统计失败:', error)
    return null
  }
}

/**
 * 获取季度统计
 */
export const getQuarterlyStatistics = async (account?: string, year?: number, quarter?: number) => {
  try {
    const params: any = {}
    if (account) params.account = account
    if (year) params.year = year
    if (quarter) params.quarter = quarter
    const ret = await $get(getScheduleBaseURL() + '/statistics/quarterly', params)
    if (ret.code === 1) {
      return ret.data as ScheduleStatistics
    }
    return null
  } catch (error) {
    console.error('获取季度统计失败:', error)
    return null
  }
}

/**
 * 获取年度统计
 */
export const getYearlyStatistics = async (account?: string, year?: number) => {
  try {
    const params: any = {}
    if (account) params.account = account
    if (year) params.year = year
    const ret = await $get(getScheduleBaseURL() + '/statistics/yearly', params)
    if (ret.code === 1) {
      return ret.data as ScheduleStatistics
    }
    return null
  } catch (error) {
    console.error('获取年度统计失败:', error)
    return null
  }
}

/**
 * 导出统计报表
 */
export const exportStatistics = (startDate: string, endDate: string, account?: string) => {
  let url = getScheduleBaseURL() + `/statistics/export?startDate=${startDate}&endDate=${endDate}`
  if (account) {
    url += `&account=${account}`
  }
  window.open(url, '_blank')
}

export const exportMonthlyCalendar = (year: number, month: number, account?: string) => {
  let url = getScheduleBaseURL() + `/statistics/exportMonthlyCalendar?year=${year}&month=${month}`
  if (account) {
    url += `&account=${account}`
  }
  window.open(url, '_blank')
}
