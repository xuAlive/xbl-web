import { $get, $post } from "../utils/request"
import { message } from '@/shared/ui/feedback'

/**
 * 角色接口
 */
export interface Role {
  id?: number
  roleCode: string
  roleName: string
  description?: string
  status?: number  // 0-禁用 1-启用
}

/**
 * 获取当前用户角色列表
 */
export const getUserRoles = async () => {
  try {
    const ret = await $get('/role/getUserRoles', {})

    if (ret.code === 1) {
      return ret.data as Role[]
    } else {
      message.error(ret.msg || '获取用户角色失败')
      return []
    }
  } catch (error) {
    console.error('获取用户角色失败:', error)
    message.error('获取用户角色失败')
    return []
  }
}

/**
 * 获取当前用户角色编码
 */
export const getUserRoleCode = async () => {
  try {
    const ret = await $get('/role/getUserRoleCode', {})

    if (ret.code === 1) {
      return ret.data as string
    } else {
      message.error(ret.msg || '获取用户角色编码失败')
      return ''
    }
  } catch (error) {
    console.error('获取用户角色编码失败:', error)
    message.error('获取用户角色编码失败')
    return ''
  }
}

/**
 * 获取所有角色列表
 */
export const getAllRoles = async () => {
  try {
    const ret = await $get('/role/getAllRoles', {})

    if (ret.code === 1) {
      return ret.data as Role[]
    } else {
      message.error(ret.msg || '获取角色列表失败')
      return []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    message.error('获取角色列表失败')
    return []
  }
}

/**
 * 为用户分配角色
 */
export const assignRoleToUser = async (account: string, roleId: number) => {
  try {
    const ret = await $post(`/role/assignToUser?account=${account}&roleId=${roleId}`, {})

    if (ret.code === 1) {
      message.success('分配角色成功')
      return true
    } else {
      message.error(ret.msg || '分配角色失败')
      return false
    }
  } catch (error) {
    console.error('分配角色失败:', error)
    message.error('分配角色失败')
    return false
  }
}

/**
 * 新增角色
 */
export const addRole = async (role: Role) => {
  try {
    const ret = await $post('/role/add', JSON.stringify(role))

    if (ret.code === 1) {
      message.success('新增角色成功')
      return true
    } else {
      message.error(ret.msg || '新增角色失败')
      return false
    }
  } catch (error) {
    console.error('新增角色失败:', error)
    message.error('新增角色失败')
    return false
  }
}

/**
 * 修改角色
 */
export const updateRole = async (role: Role) => {
  try {
    const ret = await $post('/role/update', JSON.stringify(role))

    if (ret.code === 1) {
      message.success('修改角色成功')
      return true
    } else {
      message.error(ret.msg || '修改角色失败')
      return false
    }
  } catch (error) {
    console.error('修改角色失败:', error)
    message.error('修改角色失败')
    return false
  }
}
