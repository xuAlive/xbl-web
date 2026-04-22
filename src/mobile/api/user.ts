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

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
  confirmPassword: string
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

/**
 * 更新用户信息
 */
export const updateUserInfo = async (userInfo: UserInfo): Promise<boolean> => {
  try {
    const ret = await $post('/sys/updateUserInfo', JSON.stringify(userInfo))
    if (ret.code === 1) {
      message.success('更新用户信息成功')
      return true
    } else {
      message.error(ret.codeMessage || ret.msg || '更新用户信息失败')
      return false
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    message.error('更新用户信息失败')
    return false
  }
}

/**
 * 修改当前登录用户密码
 */
export const changePassword = async (params: ChangePasswordParams): Promise<boolean> => {
  try {
    const ret = await $post('/sys/changePassword', JSON.stringify(params))
    if (ret.code === 1) {
      message.success('修改密码成功')
      return true
    } else {
      message.error(ret.codeMessage || ret.msg || '修改密码失败')
      return false
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    message.error('修改密码失败')
    return false
  }
}
