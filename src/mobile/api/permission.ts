import { $get } from '../utils/request'
import { message } from '@/shared/ui/feedback'

export interface Permission {
  id?: number
  permissionCode: string
  permissionName: string
  resourceType?: string
  resourcePath?: string
  description?: string
  status?: number
}

/**
 * 获取当前用户的权限列表
 */
export const getUserPermissions = async (): Promise<Permission[]> => {
  try {
    const ret = await $get('/permission/getUserPermissions', {})
    if (ret.code === 1) {
      return ret.data as Permission[]
    } else {
      message.error(ret.codeMessage || '获取用户权限失败')
      return []
    }
  } catch (error) {
    console.error('获取用户权限失败:', error)
    return []
  }
}
