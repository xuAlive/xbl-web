import { $get, $post } from '../utils/request'
import { message } from '@/shared/ui/feedback'
import { getScheduleBaseURL } from '../utils/config'

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

export interface Schedule {
  id?: number
  account: string
  employeeName: string
  scheduleDate: string
  shiftId: number
  shiftName: string
  status: number
  remark?: string
}

export interface Employee {
  id?: number
  employeeCode: string
  employeeName: string
  department?: string
  position?: string
  phone?: string
  email?: string
  entryDate?: string
  status: number
}

// 获取班次列表
export const getShiftList = async () => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/shift/list', {})
    if (ret.code === 1) {
      return ret.data as Shift[]
    }
    return []
  } catch (error) {
    console.error('获取班次列表失败:', error)
    return []
  }
}

// 获取我的排班
export const getMySchedules = async (startDate: string, endDate: string) => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/schedule/my', { startDate, endDate })
    if (ret.code === 1) {
      return ret.data as Schedule[]
    }
    return []
  } catch (error) {
    console.error('获取排班失败:', error)
    return []
  }
}

// 获取排班列表
export const getScheduleList = async (startDate: string, endDate: string) => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/schedule/list', { startDate, endDate })
    if (ret.code === 1) {
      return ret.data as Schedule[]
    }
    return []
  } catch (error) {
    console.error('获取排班列表失败:', error)
    return []
  }
}

// 获取员工列表
export const getEmployeeList = async () => {
  try {
    const ret = await $get(getScheduleBaseURL() + '/employee/list', {})
    if (ret.code === 1) {
      return ret.data as Employee[]
    }
    return []
  } catch (error) {
    console.error('获取员工列表失败:', error)
    return []
  }
}

// 创建员工
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
    message.error('创建失败')
    return false
  }
}

// 更新员工
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
    message.error('更新失败')
    return false
  }
}

// 删除员工
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
    message.error('删除失败')
    return false
  }
}

// 创建排班
export const createSchedule = async (schedule: Partial<Schedule>) => {
  try {
    const ret = await $post(getScheduleBaseURL() + '/schedule/create', schedule)
    if (ret.code === 1) {
      message.success('排班成功')
      return true
    } else {
      message.error(ret.codeMessage || '排班失败')
      return false
    }
  } catch (error) {
    console.error('创建排班失败:', error)
    message.error('排班失败')
    return false
  }
}

// 更新排班
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
    message.error('更新失败')
    return false
  }
}

// 删除排班
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
    message.error('删除失败')
    return false
  }
}
