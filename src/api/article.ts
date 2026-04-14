import { $post, $get } from "../utils/request"
import { message } from '@/shared/ui/feedback'
import { getAccount, getToken } from '../utils/userInfo'
import { getBaseURL } from '../config/baseURL'
import axios from 'axios'

/**
 * 文章参数接口
 */
export interface ArticleParams {
  id?: number
  account?: string
  title: string
  intro?: string  // 文章简介
  content: string
  status: number  // 0: 暂存, 1: 发布, -1: 删除
  img?: string[]  // 图片地址数组
}

/**
 * 文章列表项接口
 */
export interface Article {
  id: number
  account: string
  title: string
  intro: string | null
  img: string
  content: string
  status: number  // 0: 暂存, 1: 发布, -1: 删除
  publishedEditCount?: number
  createTime: string
  updateTime: string
}

/**
 * 分页响应接口
 */
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

/**
 * 创建或更新文章
 * @param params 文章参数
 */
export const createOrUpdateArticle = async (params: ArticleParams) => {
  try {
    // 自动添加当前登录用户的账号
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return false
    }

    const requestParams = {
      ...params,
      account,
      img: JSON.stringify(params.img || [])  // 将数组转为字符串
    }

    const ret = await $post('/article/createOrUpdateArticle', JSON.stringify(requestParams))

    if (ret.code === 1) {
      return ret.data as Article
    } else {
      message.error(ret.codeMessage || '操作失败')
      return null
    }
  } catch (error) {
    console.error('创建或更新文章失败:', error)
    message.error('操作失败，请稍后重试')
    return null
  }
}

/**
 * 保存草稿
 * @param title 标题
 * @param content 内容
 * @param intro 简介
 * @param img 图片数组
 */
export const saveDraft = async (title: string, content: string, intro: string = '', img: string[] = [], id?: number) => {
  return await createOrUpdateArticle({
    id,
    title,
    content,
    intro,
    status: 0,
    img
  })
}

/**
 * 发布文章
 * @param title 标题
 * @param content 内容
 * @param intro 简介
 * @param img 图片数组
 */
export const publishArticle = async (title: string, content: string, intro: string = '', img: string[] = [], id?: number) => {
  return await createOrUpdateArticle({
    id,
    title,
    content,
    intro,
    status: 1,
    img
  })
}

/**
 * 删除文章
 * @param id 文章ID
 */
export const deleteArticle = async (id: number) => {
  try {
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return false
    }

    const ret = await $post('/article/deleteArticle', JSON.stringify({ id, account }))

    if (ret.code === 1) {
      return true
    } else {
      message.error(ret.codeMessage || '删除失败')
      return false
    }
  } catch (error) {
    console.error('删除文章失败:', error)
    message.error('删除失败，请稍后重试')
    return false
  }
}

/**
 * 获取文章列表
 * @param page 页码
 * @param size 每页大小
 * @returns 文章列表响应数据
 */
export const listArticle = async (page: number = 1, size: number = 10) => {
  try {
    // 自动添加当前登录用户的账号
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return null
    }

    const params = {
      account,
      page,
      size
    }

    const ret = await $get('/article/listArticle', params)

    if (ret.code === 1) {
      return ret.data as ArticleListResponse
    } else {
      message.error(ret.codeMessage || '获取文章列表失败')
      return null
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    message.error('获取文章列表失败，请稍后重试')
    return null
  }
}

/**
 * 获取博客广场文章列表（所有已发布文章）
 * @param page 页码
 * @param size 每页大小
 * @param title 标题模糊搜索
 * @returns 文章列表响应数据
 */
export const listPublicArticles = async (page: number = 1, size: number = 10, title?: string) => {
  try {
    const params: any = { page, size }
    if (title) {
      params.title = title
    }
    // 不传 account 查询所有已发布文章

    const ret = await $get('/article/listArticle', params)

    if (ret.code === 1) {
      return ret.data as ArticleListResponse
    } else {
      message.error(ret.codeMessage || '获取文章列表失败')
      return null
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    return null
  }
}

/**
 * 获取文章详情
 * @param id 文章ID
 * @returns 文章详情
 */
export const getArticleById = async (id: number, recordView: boolean = true) => {
  try {
    const ret = await $get('/article/getArticleById', { id, recordView })

    if (ret.code === 1) {
      return ret.data as Article
    } else {
      message.error(ret.codeMessage || '获取文章详情失败')
      return null
    }
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

/**
 * 上传图片
 * @param file 文件对象
 * @returns 图片访问URL，失败返回null
 */
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const storedToken = getToken()
    const headers: Record<string, string> = {}
    if (storedToken) {
      headers.Authorization = `Bearer ${storedToken}`
    }

    const ret = await axios.post(getBaseURL() + '/article/uploadImage', formData, { headers })

    if (ret.data.code === 1) {
      return ret.data.data as string
    } else {
      message.error(ret.data.codeMessage || '图片上传失败')
      return null
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    message.error('图片上传失败，请稍后重试')
    return null
  }
}
