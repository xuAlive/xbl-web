import { $get, $post } from "../utils/request"
import { message } from '@/shared/ui/feedback'
import { getCalendarBaseURL } from '@/shared/config/runtime'

/**
 * 事件接口
 */
export interface CalendarEvent {
  id?: number
  account?: string
  title: string
  content?: string
  eventDate: string
  eventTime?: string
  eventType: number  // 1-待办 2-记事 3-纪念日
  status?: number    // 1-待完成 2-已完成 3-已过期
  priority?: number  // 1-低 2-中 3-高
  mood?: string      // 心情
  tags?: string
  createTime?: string
  updateTime?: string
}

/**
 * 提醒接口
 */
export interface Reminder {
  id?: number
  eventId?: number
  title?: string     // 提醒标题(不超过20字)
  account?: string
  remindTime: string
  remindBefore?: number
  notificationType?: string
  status?: number  // 1-待发送 2-已发送 3-发送失败
  retryCount?: number
}

/**
 * 通知方式接口
 */
export interface NotificationMethod {
  id: number
  code: string
  name: string
  icon?: string
  description?: string
  implStatus: number  // 0-未实现 1-已实现
  sortOrder: number
  status: number
}

/**
 * 应用内通知接口
 */
export interface AppNotification {
  id: number
  account: string
  title: string
  content?: string
  remindTime: string
  sourceType?: number
  sourceId?: number
  isRead: number
  createTime?: string
}

/**
 * 通知日志接口
 */
export interface NotificationLog {
  id: number
  account: string
  sourceType?: number
  sourceId?: number
  notificationType?: string
  title?: string
  content?: string
  status?: number
  errorMessage?: string
  sendTime?: string
  createTime?: string
}

/**
 * 周期计划接口
 */
export interface CyclePlan {
  id?: number
  account?: string
  title: string
  content?: string
  cycleType: number  // 1-每周 2-每月 3-自定义
  cycleConfig?: string
  cronExpression?: string
  startDate: string
  endDate?: string
  notificationType?: string
  remindTime?: string
  status?: number  // 1-启用 2-暂停 3-已结束
  nextTriggerTime?: string
  lastTriggerTime?: string
}

// ==================== 事件相关 ====================

/**
 * 获取事件列表
 */
export const getEventList = async (startDate: string, endDate: string) => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/event/list', { startDate, endDate })
    if (ret.code === 1) {
      return ret.data as CalendarEvent[]
    } else {
      message.error(ret.codeMessage || '获取事件列表失败')
      return []
    }
  } catch (error) {
    console.error('获取事件列表失败:', error)
    message.error('获取事件列表失败')
    return []
  }
}

/**
 * 获取月度事件
 */
export const getMonthEvents = async (year: number, month: number) => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/event/month', { year, month })
    if (ret.code === 1) {
      return ret.data as CalendarEvent[]
    } else {
      message.error(ret.codeMessage || '获取月度事件失败')
      return []
    }
  } catch (error) {
    console.error('获取月度事件失败:', error)
    message.error('获取月度事件失败')
    return []
  }
}

/**
 * 获取事件详情
 */
export const getEventDetail = async (id: number) => {
  try {
    const ret = await $get(getCalendarBaseURL() + `/event/detail/${id}`, {})
    if (ret.code === 1) {
      return ret.data as CalendarEvent
    } else {
      message.error(ret.codeMessage || '获取事件详情失败')
      return null
    }
  } catch (error) {
    console.error('获取事件详情失败:', error)
    message.error('获取事件详情失败')
    return null
  }
}

/**
 * 创建事件
 */
export const createEvent = async (event: CalendarEvent) => {
  try {
    const ret = await $post(getCalendarBaseURL() + '/event/create', event)
    if (ret.code === 1) {
      message.success('创建成功')
      return true
    } else {
      message.error(ret.codeMessage || '创建失败')
      return false
    }
  } catch (error) {
    console.error('创建事件失败:', error)
    message.error('创建事件失败')
    return false
  }
}

/**
 * 更新事件
 */
export const updateEvent = async (event: CalendarEvent) => {
  try {
    const ret = await $post(getCalendarBaseURL() + '/event/update', event)
    if (ret.code === 1) {
      message.success('更新成功')
      return true
    } else {
      message.error(ret.codeMessage || '更新失败')
      return false
    }
  } catch (error) {
    console.error('更新事件失败:', error)
    message.error('更新事件失败')
    return false
  }
}

/**
 * 删除事件
 */
export const deleteEvent = async (id: number) => {
  try {
    const ret = await $post(getCalendarBaseURL() + `/event/delete`, { id })
    if (ret.code === 1) {
      message.success('删除成功')
      return true
    } else {
      message.error(ret.codeMessage || '删除失败')
      return false
    }
  } catch (error) {
    console.error('删除事件失败:', error)
    message.error('删除事件失败')
    return false
  }
}

/**
 * 更新事件状态
 */
export const updateEventStatus = async (id: number, status: number) => {
  try {
    const ret = await $post(getCalendarBaseURL() + `/event/status`, { id, status })
    if (ret.code === 1) {
      message.success('状态更新成功')
      return true
    } else {
      message.error(ret.codeMessage || '状态更新失败')
      return false
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    message.error('更新状态失败')
    return false
  }
}

// ==================== 提醒相关 ====================

/**
 * 获取提醒列表
 */
export const getReminderList = async () => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/reminder/list', {})
    if (ret.code === 1) {
      return ret.data as Reminder[]
    } else {
      message.error(ret.codeMessage || '获取提醒列表失败')
      return []
    }
  } catch (error) {
    console.error('获取提醒列表失败:', error)
    message.error('获取提醒列表失败')
    return []
  }
}

/**
 * 创建提醒
 */
export const createReminder = async (reminder: Reminder) => {
  try {
    const ret = await $post(getCalendarBaseURL() + '/reminder/create', reminder)
    if (ret.code === 1) {
      message.success('提醒创建成功')
      return true
    } else {
      message.error(ret.codeMessage || '创建提醒失败')
      return false
    }
  } catch (error) {
    console.error('创建提醒失败:', error)
    message.error('创建提醒失败')
    return false
  }
}

/**
 * 取消提醒
 */
export const cancelReminder = async (id: number) => {
  try {
    const ret = await $post(getCalendarBaseURL() + `/reminder/cancel`, { id })
    if (ret.code === 1) {
      message.success('提醒已取消')
      return true
    } else {
      message.error(ret.codeMessage || '取消提醒失败')
      return false
    }
  } catch (error) {
    console.error('取消提醒失败:', error)
    message.error('取消提醒失败')
    return false
  }
}

// ==================== 周期计划相关 ====================

/**
 * 获取周期计划列表
 */
export const getCyclePlanList = async () => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/cycle/list', {})
    if (ret.code === 1) {
      return ret.data as CyclePlan[]
    } else {
      message.error(ret.codeMessage || '获取周期计划失败')
      return []
    }
  } catch (error) {
    console.error('获取周期计划失败:', error)
    message.error('获取周期计划失败')
    return []
  }
}

/**
 * 创建周期计划
 */
export const createCyclePlan = async (plan: CyclePlan) => {
  try {
    const ret = await $post(getCalendarBaseURL() + '/cycle/create', plan)
    if (ret.code === 1) {
      message.success('周期计划创建成功')
      return true
    } else {
      message.error(ret.codeMessage || '创建周期计划失败')
      return false
    }
  } catch (error) {
    console.error('创建周期计划失败:', error)
    message.error('创建周期计划失败')
    return false
  }
}

/**
 * 更新周期计划
 */
export const updateCyclePlan = async (plan: CyclePlan) => {
  try {
    const ret = await $post(getCalendarBaseURL() + '/cycle/update', plan)
    if (ret.code === 1) {
      message.success('更新成功')
      return true
    } else {
      message.error(ret.codeMessage || '更新失败')
      return false
    }
  } catch (error) {
    console.error('更新周期计划失败:', error)
    message.error('更新周期计划失败')
    return false
  }
}

/**
 * 删除周期计划
 */
export const deleteCyclePlan = async (id: number) => {
  try {
    const ret = await $post(getCalendarBaseURL() + `/cycle/delete`, { id })
    if (ret.code === 1) {
      message.success('删除成功')
      return true
    } else {
      message.error(ret.codeMessage || '删除失败')
      return false
    }
  } catch (error) {
    console.error('删除周期计划失败:', error)
    message.error('删除周期计划失败')
    return false
  }
}

/**
 * 暂停周期计划
 */
export const pauseCyclePlan = async (id: number) => {
  try {
    const ret = await $post(getCalendarBaseURL() + `/cycle/pause`, { id })
    if (ret.code === 1) {
      message.success('已暂停')
      return true
    } else {
      message.error(ret.codeMessage || '暂停失败')
      return false
    }
  } catch (error) {
    console.error('暂停周期计划失败:', error)
    message.error('暂停周期计划失败')
    return false
  }
}

/**
 * 恢复周期计划
 */
export const resumeCyclePlan = async (id: number) => {
  try {
    const ret = await $post(getCalendarBaseURL() + `/cycle/resume`, { id })
    if (ret.code === 1) {
      message.success('已恢复')
      return true
    } else {
      message.error(ret.codeMessage || '恢复失败')
      return false
    }
  } catch (error) {
    console.error('恢复周期计划失败:', error)
    message.error('恢复周期计划失败')
    return false
  }
}

/**
 * 获取即将触发的计划
 */
export const getUpcomingPlans = async (hours: number = 24) => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/cycle/upcoming', { hours })
    if (ret.code === 1) {
      return ret.data as CyclePlan[]
    } else {
      message.error(ret.codeMessage || '获取即将触发计划失败')
      return []
    }
  } catch (error) {
    console.error('获取即将触发计划失败:', error)
    message.error('获取即将触发计划失败')
    return []
  }
}

// ==================== 通知方式相关 ====================

/**
 * 获取通知方式列表
 */
export const getNotificationMethods = async () => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/notification-method/list', {})
    if (ret.code === 1) {
      return ret.data as NotificationMethod[]
    }
    return []
  } catch (error) {
    console.error('获取通知方式失败:', error)
    return []
  }
}

// ==================== 应用内通知相关 ====================

/**
 * 获取待显示的通知
 */
export const getPendingNotifications = async () => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/app-notification/pending', {})
    if (ret.code === 1) {
      return ret.data as AppNotification[]
    }
    return []
  } catch (error) {
    console.error('获取通知失败:', error)
    return []
  }
}

/**
 * 获取全部应用内通知
 */
export const getNotificationList = async () => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/app-notification/list', {})
    if (ret.code === 1) {
      return ret.data as AppNotification[]
    }
    return []
  } catch (error) {
    console.error('获取通知列表失败:', error)
    return []
  }
}

/**
 * 标记通知为已读
 */
export const markNotificationAsRead = async (id: number) => {
  try {
    const ret = await $post(getCalendarBaseURL() + `/app-notification/read`, { id })
    return ret.code === 1
  } catch (error) {
    console.error('标记已读失败:', error)
    return false
  }
}

/**
 * 标记全部通知已读
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const ret = await $post(getCalendarBaseURL() + '/app-notification/readAll', {})
    return ret.code === 1
  } catch (error) {
    console.error('标记全部已读失败:', error)
    return false
  }
}

/**
 * 获取通知投递记录
 */
export const getNotificationLogs = async () => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/notification-log/list', {})
    if (ret.code === 1) {
      return ret.data as NotificationLog[]
    }
    return []
  } catch (error) {
    console.error('获取通知投递记录失败:', error)
    return []
  }
}
