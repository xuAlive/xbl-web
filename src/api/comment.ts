import { $post, $get } from "../utils/request"
import { message } from '@/shared/ui/feedback'
import { getAccount } from '../utils/userInfo'

/**
 * 评论接口类型
 */
export interface Comment {
  id: number
  articleId: number
  parentId: number
  content: string
  commenterName: string
  commenterAccount: string
  createTime: string
  articleTitle?: string
  replies?: Comment[]
}

/**
 * 添加评论
 * @param articleId 文章ID
 * @param content 评论内容
 * @param parentId 父评论ID，0表示直接评论
 * @param commenterName 评论者昵称
 */
export const addComment = async (articleId: number, content: string, parentId: number = 0, commenterName?: string) => {
  try {
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return false
    }

    const params = {
      articleId,
      parentId,
      content,
      commenterName: commenterName || account,
      commenterAccount: account
    }

    const ret = await $post('/comment/add', JSON.stringify(params))

    if (ret.code === 1) {
      return true
    } else {
      message.error(ret.codeMessage || '评论失败')
      return false
    }
  } catch (error) {
    console.error('添加评论失败:', error)
    message.error('评论失败，请稍后重试')
    return false
  }
}

/**
 * 获取文章评论列表（树形结构）
 * @param articleId 文章ID
 */
export const listCommentsByArticle = async (articleId: number) => {
  try {
    const ret = await $get('/comment/listByArticle', { articleId })

    if (ret.code === 1) {
      return ret.data as Comment[]
    } else {
      message.error(ret.codeMessage || '获取评论失败')
      return []
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    return []
  }
}

/**
 * 获取最新评论列表
 * @param limit 数量限制
 */
export const listLatestComments = async (limit: number = 10) => {
  try {
    const ret = await $get('/comment/listLatest', { limit })

    if (ret.code === 1) {
      return ret.data as Comment[]
    } else {
      return []
    }
  } catch (error) {
    console.error('获取最新评论失败:', error)
    return []
  }
}

/**
 * 删除评论
 * @param id 评论ID
 */
export const deleteComment = async (id: number) => {
  try {
    const account = getAccount()
    if (!account) {
      message.error('请先登录')
      return false
    }

    const ret = await $post('/comment/delete', { id, account })

    if (ret.code === 1) {
      return true
    } else {
      message.error(ret.codeMessage || '删除失败')
      return false
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    return false
  }
}
