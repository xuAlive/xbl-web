import { $post, $get } from '../utils/request'
import { message } from '@/shared/ui/feedback'
import { getAccount } from '../utils/auth'

export interface Article {
  id: number
  account: string
  title: string
  intro: string | null
  img: string
  content: string
  status: number
  createTime: string
  updateTime: string
}

export interface ArticleListResponse {
  records: Article[]
  total: number
  size: number
  current: number
  pages: number
}

export interface BrowsingHistoryItem {
  id: number
  articleId: number
  title: string
  author: string
  articleCreateTime: string
  lastViewTime: string
}

// 获取公开文章列表
export const listPublicArticles = async (page: number = 1, size: number = 10, title?: string) => {
  try {
    const params: any = { page, size }
    if (title) params.title = title

    const ret = await $get('/article/listArticle', params)
    if (ret.code === 1) {
      return ret.data as ArticleListResponse
    }
    return null
  } catch (error) {
    console.error('获取文章列表失败:', error)
    return null
  }
}

// 获取我的文章列表
export const listArticle = async (page: number = 1, size: number = 10) => {
  try {
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return null
    }

    const ret = await $get('/article/listArticle', { account, page, size })
    if (ret.code === 1) {
      return ret.data as ArticleListResponse
    }
    return null
  } catch (error) {
    console.error('获取文章列表失败:', error)
    return null
  }
}

// 获取文章详情
export const getArticleById = async (id: number) => {
  try {
    const ret = await $get('/article/getArticleById', { id })
    if (ret.code === 1) {
      return ret.data as Article
    }
    return null
  } catch (error) {
    console.error('获取文章详情失败:', error)
    return null
  }
}

export const listBrowsingHistory = async () => {
  try {
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return []
    }

    const ret = await $get('/article/listBrowsingHistory', {})
    if (ret.code === 1) {
      return (ret.data || []) as BrowsingHistoryItem[]
    }

    message.error(ret.codeMessage || '获取浏览记录失败')
    return []
  } catch (error) {
    console.error('获取浏览记录失败:', error)
    message.error('获取浏览记录失败，请稍后重试')
    return []
  }
}

export const deleteBrowsingHistory = async (id: number) => {
  try {
    const ret = await $post(`/article/deleteBrowsingHistory?id=${id}`, {})
    if (ret.code === 1) {
      return true
    }

    message.error(ret.codeMessage || '删除浏览记录失败')
    return false
  } catch (error) {
    console.error('删除浏览记录失败:', error)
    message.error('删除浏览记录失败，请稍后重试')
    return false
  }
}

export const clearBrowsingHistory = async () => {
  try {
    const ret = await $post('/article/clearBrowsingHistory', {})
    if (ret.code === 1) {
      return true
    }

    message.error(ret.codeMessage || '清空浏览记录失败')
    return false
  } catch (error) {
    console.error('清空浏览记录失败:', error)
    message.error('清空浏览记录失败，请稍后重试')
    return false
  }
}

// 创建或更新文章
const createOrUpdateArticle = async (params: any) => {
  try {
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return false
    }

    const requestParams = {
      ...params,
      account,
      img: JSON.stringify(params.img || [])
    }

    const ret = await $post('/article/createOrUpdateArticle', requestParams)
    if (ret.code === 1) {
      return true
    }
    message.error(ret.codeMessage || '操作失败')
    return false
  } catch (error) {
    console.error('操作失败:', error)
    return false
  }
}

// 保存草稿
export const saveDraft = async (title: string, content: string, intro: string = '') => {
  return createOrUpdateArticle({ title, content, intro, status: 0 })
}

// 发布文章
export const publishArticle = async (title: string, content: string, intro: string = '') => {
  return createOrUpdateArticle({ title, content, intro, status: 1 })
}
