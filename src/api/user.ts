import { $get, $post } from "../utils/request"
import { message } from '@/shared/ui/feedback'

/**
 * 用户基本信息（列表）
 */
export interface UserBasic {
  account: string
  userName: string
  name: string
  email: string
  phone: string
  isDelete: number  // 0-正常 1-已删除
  createTime: string
  updateTime: string
}

/**
 * 用户详细信息
 */
export interface UserInfo {
  account: string
  phone: string
  name: string
  userName: string
  birthday?: string
  age?: number
  sex?: number  // 0-女 1-男
  email: string
  idCard?: string
  intro?: string
}

/**
 * 获取用户列表（管理员）
 */
export const getUserList = async () => {
  try {
    const ret = await $get('/sys/getUserList', {})

    if (ret.code === 1) {
      return ret.data as UserBasic[]
    } else {
      message.error(ret.msg || '获取用户列表失败')
      return []
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    message.error('获取用户列表失败')
    return []
  }
}

/**
 * 根据账号获取用户信息
 * @param account 用户账号（不传则获取当前登录用户信息）
 */
export const getUserInfoByAccount = async (account?: string) => {
  try {
    const params = account ? { account } : {}
    const ret = await $get('/sys/getUserInfoByAccount', params)

    if (ret.code === 1) {
      return ret.data as UserInfo
    } else {
      message.error(ret.msg || '获取用户信息失败')
      return null
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error('获取用户信息失败')
    return null
  }
}

/**
 * 验证手机号（游客升级为正式用户）
 */
export const verifyPhone = async (phone: string) => {
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

/**
 * 更新用户信息
 */
export const updateUserInfo = async (userInfo: UserInfo) => {
  try {
    const ret = await $post('/sys/updateUserInfo', JSON.stringify(userInfo))

    if (ret.code === 1) {
      message.success('更新用户信息成功')
      return true
    } else {
      message.error(ret.msg || '更新用户信息失败')
      return false
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    message.error('更新用户信息失败')
    return false
  }
}
