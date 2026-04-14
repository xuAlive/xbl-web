import { $get, $post } from "../utils/request"
import { message } from '@/shared/ui/feedback'

/**
 * 菜单接口
 */
export interface Menu {
  id?: number
  parentId: number
  menuName: string
  menuCode: string
  menuType: number  // 1-目录 2-菜单 3-按钮
  path?: string
  component?: string
  icon?: string
  sortOrder?: number
  visible?: number  // 0-隐藏 1-显示
  status?: number  // 0-禁用 1-启用
  permission?: string
  children?: Menu[]
}

/**
 * 获取当前用户菜单树
 */
export const getUserMenus = async () => {
  try {
    const ret = await $get('/menu/getUserMenus', {})

    if (ret.code === 1) {
      return ret.data as Menu[]
    } else {
      message.error(ret.msg || '获取用户菜单失败')
      return []
    }
  } catch (error) {
    console.error('获取用户菜单失败:', error)
    message.error('获取用户菜单失败')
    return []
  }
}

/**
 * 获取所有菜单树（管理员）
 */
export const getAllMenus = async () => {
  try {
    const ret = await $get('/menu/getAllMenus', {})

    if (ret.code === 1) {
      return ret.data as Menu[]
    } else {
      message.error(ret.msg || '获取菜单列表失败')
      return []
    }
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    message.error('获取菜单列表失败')
    return []
  }
}

/**
 * 获取菜单列表（平铺）
 */
export const getMenuList = async () => {
  try {
    const ret = await $get('/menu/getMenuList', {})

    if (ret.code === 1) {
      return ret.data as Menu[]
    } else {
      message.error(ret.msg || '获取菜单列表失败')
      return []
    }
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    message.error('获取菜单列表失败')
    return []
  }
}

/**
 * 新增菜单
 */
export const addMenu = async (menu: Menu) => {
  try {
    const ret = await $post('/menu/add', JSON.stringify(menu))

    if (ret.code === 1) {
      message.success('新增菜单成功')
      return true
    } else {
      message.error(ret.msg || '新增菜单失败')
      return false
    }
  } catch (error) {
    console.error('新增菜单失败:', error)
    message.error('新增菜单失败')
    return false
  }
}

/**
 * 修改菜单
 */
export const updateMenu = async (menu: Menu) => {
  try {
    const ret = await $post('/menu/update', JSON.stringify(menu))

    if (ret.code === 1) {
      message.success('修改菜单成功')
      return true
    } else {
      message.error(ret.msg || '修改菜单失败')
      return false
    }
  } catch (error) {
    console.error('修改菜单失败:', error)
    message.error('修改菜单失败')
    return false
  }
}

/**
 * 删除菜单
 */
export const deleteMenu = async (menuId: number) => {
  try {
    const ret = await $post(`/menu/delete?menuId=${menuId}`, {})

    if (ret.code === 1) {
      message.success('删除菜单成功')
      return true
    } else {
      message.error(ret.msg || '删除菜单失败')
      return false
    }
  } catch (error) {
    console.error('删除菜单失败:', error)
    message.error('删除菜单失败')
    return false
  }
}

/**
 * 为角色分配菜单
 */
export const assignMenusToRole = async (roleId: number, menuIds: number[]) => {
  try {
    const ret = await $post(`/menu/assignToRole?roleId=${roleId}`, JSON.stringify(menuIds))

    if (ret.code === 1) {
      message.success('分配菜单成功')
      return true
    } else {
      message.error(ret.msg || '分配菜单失败')
      return false
    }
  } catch (error) {
    console.error('分配菜单失败:', error)
    message.error('分配菜单失败')
    return false
  }
}

/**
 * 获取角色已分配的菜单ID列表（用于回显）
 */
export const getMenuIdsByRoleId = async (roleId: number) => {
  try {
    const ret = await $get(`/menu/getMenuIdsByRoleId`, { roleId })

    if (ret.code === 1) {
      return ret.data as number[]
    } else {
      message.error(ret.msg || '获取角色菜单失败')
      return []
    }
  } catch (error) {
    console.error('获取角色菜单失败:', error)
    message.error('获取角色菜单失败')
    return []
  }
}
