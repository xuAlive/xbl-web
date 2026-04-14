import { $get } from '../utils/request'
import { message } from '@/shared/ui/feedback'

export interface Menu {
  id?: number
  menuName: string
  menuPath?: string
  menuIcon?: string
  parentId?: number
  orderNum?: number
  children?: Menu[]
}

/**
 * 获取当前用户的菜单树
 */
export const getUserMenus = async (): Promise<Menu[]> => {
  try {
    const ret = await $get('/menu/getUserMenus', {})
    if (ret.code === 1) {
      return ret.data as Menu[]
    } else {
      message.error(ret.codeMessage || '获取用户菜单失败')
      return []
    }
  } catch (error) {
    console.error('获取用户菜单失败:', error)
    return []
  }
}
