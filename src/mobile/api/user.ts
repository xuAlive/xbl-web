import { $get, $post } from '../utils/request'
import { message } from '@/shared/ui/feedback'

export interface UserInfo {
  account: string
  phone: string
  name: string
  userName: string
  birthday?: string
  age?: number
  sex?: number
  email: string
  idCard?: string
  intro?: string
}

/**
 * 根据账号获取用户信息
 */
export const getUserInfoByAccount = async (account?: string): Promise<UserInfo | null> => {
  try {
    const params = account ? { account } : {}
    const ret = await $get('/sys/getUserInfoByAccount', params)
    if (ret.code === 1) {
      return ret.data as UserInfo
    } else {
      message.error(ret.codeMessage || '获取用户信息失败')
      return null
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 验证手机号（游客升级为正式用户）
 */
export const verifyPhone = async (phone: string): Promise<boolean> => {
  try {
    const ret = await $post(`/user/verifyPhone?phone=${encodeURIComponent(phone)}`, {})
    if (ret.code === 1) {
      message.success(ret.data || '手机号验证成功')
      return true
    } else {
      message.error(ret.codeMessage || '手机号验证失败')
      return false
    }
  } catch (error) {
    console.error('手机号验证失败:', error)
    message.error('手机号验证失败')
    return false
  }
}
