import { $get } from '../utils/request'
import { message } from '@/shared/ui/feedback'

/**
 * 获取当前用户角色编码
 */
export const getUserRoleCode = async (): Promise<string> => {
  try {
    const ret = await $get('/role/getUserRoleCode', {})
    if (ret.code === 1) {
      return ret.data as string
    } else {
      message.error(ret.codeMessage || '获取用户角色编码失败')
      return ''
    }
  } catch (error) {
    console.error('获取用户角色编码失败:', error)
    return ''
  }
}
