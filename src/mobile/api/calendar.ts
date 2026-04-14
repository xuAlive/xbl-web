import { $get, $post } from '../utils/request'
import { message } from '@/shared/ui/feedback'
import { getCalendarBaseURL } from '../utils/config'

export interface CalendarEvent {
  id?: number
  account?: string
  title: string
  content?: string
  eventDate: string
  eventTime?: string
  eventType: number
  status?: number
  priority?: number
  mood?: string
  tags?: string
  createTime?: string
  updateTime?: string
}

export interface Reminder {
  id?: number
  eventId?: number
  title?: string
  account?: string
  remindTime: string
  remindBefore?: number
  notificationType?: string
  status?: number
  retryCount?: number
}

// 获取月度事件
export const getMonthEvents = async (year: number, month: number) => {
  try {
    const ret = await $get(getCalendarBaseURL() + '/event/month', { year, month })
    if (ret.code === 1) {
      return ret.data as CalendarEvent[]
    }
    return []
  } catch (error) {
    console.error('获取月度事件失败:', error)
    return []
  }
}

// 创建事件
export const createEvent = async (event: CalendarEvent) => {
  try {
    const ret = await $post(getCalendarBaseURL() + '/event/create', event)
    if (ret.code === 1) {
      message.success('保存成功')
      return true
    } else {
      message.error(ret.codeMessage || '保存失败')
      return false
    }
  } catch (error) {
    console.error('创建事件失败:', error)
    message.error('保存失败')
    return false
  }
}

// 更新事件
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
    message.error('更新失败')
    return false
  }
}

// 删除事件
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
    message.error('删除失败')
    return false
  }
}

// 获取事件详情
export const getEventById = async (id: number) => {
  try {
    const ret = await $get(getCalendarBaseURL() + `/event/detail/${id}`, {})
    if (ret.code === 1) {
      return ret.data as CalendarEvent
    }
    return null
  } catch (error) {
    console.error('获取事件详情失败:', error)
    return null
  }
}
