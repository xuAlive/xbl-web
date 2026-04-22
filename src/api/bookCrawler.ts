import { $get, $post } from '../utils/request'
import { message } from '@/shared/ui/feedback'
import { getCrawlerBaseURL } from '@/shared/config/runtime'

export interface BookCrawlerTask {
  id?: number
  account?: string
  taskName: string
  siteName?: string
  bookName?: string
  catalogUrl: string
  chapterLinkSelector?: string
  chapterTitleSelector?: string
  contentSelector?: string
  contentRemoveSelectors?: string
  startChapterNum: number
  endChapterNum?: number | null
  intervalSeconds: number
  saveDirectory: string
  status?: number
  totalChapters?: number
  successChapters?: number
  failedChapters?: number
  lastMessage?: string
  lastStartTime?: string
  lastFinishTime?: string
  createTime?: string
  updateTime?: string
}

export interface BookCrawlerChapter {
  id: number
  taskId: number
  chapterIndex: number
  chapterTitle?: string
  chapterUrl: string
  savePath?: string
  contentLength?: number
  crawlStatus?: number
  errorMessage?: string
  startTime?: string
  finishTime?: string
  createTime?: string
  updateTime?: string
}

export interface BookCrawlerPreviewChapter {
  chapterIndex: number
  chapterTitle: string
  chapterUrl: string
}

export interface BookCrawlerTaskDetail {
  task: BookCrawlerTask
  chapters: BookCrawlerChapter[]
}

export type BookCrawlerTaskSavePayload = Omit<
  BookCrawlerTask,
  'account' | 'status' | 'totalChapters' | 'successChapters' | 'failedChapters' | 'lastMessage' |
  'lastStartTime' | 'lastFinishTime' | 'createTime' | 'updateTime'
>

export interface BookCrawlerPreviewPayload {
  catalogUrl: string
  chapterLinkSelector?: string
  chapterTitleSelector?: string
  contentSelector?: string
  contentRemoveSelectors?: string
}

const getErrorMessage = (ret: any, fallback: string) => ret?.codeMessage || ret?.msg || fallback

export const getBookCrawlerTaskList = async () => {
  try {
    const ret = await $get(getCrawlerBaseURL() + '/book/task/list')
    if (ret.code === 1) {
      return ret.data as BookCrawlerTask[]
    }
    message.error(getErrorMessage(ret, '获取爬虫任务列表失败'))
    return []
  } catch (error) {
    console.error('获取爬虫任务列表失败:', error)
    message.error('获取爬虫任务列表失败')
    return []
  }
}

export const getBookCrawlerTaskDetail = async (id: number) => {
  try {
    const ret = await $get(getCrawlerBaseURL() + `/book/task/detail/${id}`)
    if (ret.code === 1) {
      return ret.data as BookCrawlerTaskDetail
    }
    message.error(getErrorMessage(ret, '获取爬虫任务详情失败'))
    return null
  } catch (error) {
    console.error('获取爬虫任务详情失败:', error)
    message.error('获取爬虫任务详情失败')
    return null
  }
}

export const previewBookCrawlerChapters = async (payload: BookCrawlerPreviewPayload) => {
  try {
    const ret = await $post(getCrawlerBaseURL() + '/book/preview', payload)
    if (ret.code === 1) {
      return ret.data as BookCrawlerPreviewChapter[]
    }
    message.error(getErrorMessage(ret, '预览章节失败'))
    return []
  } catch (error) {
    console.error('预览章节失败:', error)
    message.error('预览章节失败')
    return []
  }
}

export const saveBookCrawlerTask = async (payload: BookCrawlerTaskSavePayload) => {
  try {
    const ret = await $post(getCrawlerBaseURL() + '/book/task/save', payload)
    if (ret.code === 1) {
      message.success('任务保存成功')
      return Number(ret.data)
    }
    message.error(getErrorMessage(ret, '保存任务失败'))
    return null
  } catch (error) {
    console.error('保存任务失败:', error)
    message.error('保存任务失败')
    return null
  }
}

export const deleteBookCrawlerTask = async (id: number) => {
  try {
    const ret = await $post(getCrawlerBaseURL() + '/book/task/delete', { id })
    if (ret.code === 1) {
      message.success('任务已删除')
      return true
    }
    message.error(getErrorMessage(ret, '删除任务失败'))
    return false
  } catch (error) {
    console.error('删除任务失败:', error)
    message.error('删除任务失败')
    return false
  }
}

export const startBookCrawlerTask = async (id: number) => {
  try {
    const ret = await $post(getCrawlerBaseURL() + '/book/task/start', { id })
    if (ret.code === 1) {
      message.success('抓取任务已启动')
      return true
    }
    message.error(getErrorMessage(ret, '启动抓取任务失败'))
    return false
  } catch (error) {
    console.error('启动抓取任务失败:', error)
    message.error('启动抓取任务失败')
    return false
  }
}

export const pauseBookCrawlerTask = async (id: number) => {
  try {
    const ret = await $post(getCrawlerBaseURL() + '/book/task/pause', { id })
    if (ret.code === 1) {
      message.success('暂停请求已提交')
      return true
    }
    message.error(getErrorMessage(ret, '暂停抓取任务失败'))
    return false
  } catch (error) {
    console.error('暂停抓取任务失败:', error)
    message.error('暂停抓取任务失败')
    return false
  }
}
