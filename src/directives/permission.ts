import type { App, Directive } from 'vue'
import { hasPermission, getUserRoleCode } from '../utils/userInfo'

/**
 * v-permission 指令
 * 用法：v-permission="'permission_code'" - 检查是否有指定权限
 * 无权限时移除元素
 */
const permissionDirective: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const permissionCode = binding.value
    if (!permissionCode) return

    if (!hasPermission(permissionCode)) {
      el.parentNode?.removeChild(el)
    }
  }
}

/**
 * v-role 指令
 * 用法：v-role="'ADMIN'" - 检查是否有指定角色
 * 无对应角色时移除元素
 */
const roleDirective: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const requiredRole = binding.value
    if (!requiredRole) return

    const userRole = getUserRoleCode()
    const roleLevel: Record<string, number> = { ADMIN: 3, USER: 2, GUEST: 1 }
    const userLevel = roleLevel[userRole] || 0
    const requiredLevel = roleLevel[requiredRole] || 0

    if (userLevel < requiredLevel) {
      el.parentNode?.removeChild(el)
    }
  }
}

export function setupPermissionDirectives(app: App) {
  app.directive('permission', permissionDirective)
  app.directive('role', roleDirective)
}
