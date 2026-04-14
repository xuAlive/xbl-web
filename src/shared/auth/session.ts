export interface SessionUserInfo {
  account: string
  token: string
  name?: string
  userName?: string
  [key: string]: unknown
}

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'user_info'
const USER_MENUS_KEY = 'user_menus'
const USER_ROLE_CODE_KEY = 'user_role_code'
const USER_PERMISSIONS_KEY = 'user_permissions'

function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = sessionStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch (error) {
    console.error(`读取 ${key} 失败:`, error)
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`写入 ${key} 失败:`, error)
  }
}

export const setToken = (token: string) => {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || ''

export const setUserInfo = (userInfo: SessionUserInfo) => {
  writeJSON(USER_INFO_KEY, userInfo)

  if (userInfo.token) {
    setToken(userInfo.token)
  }
}

export const getUserInfo = () => readJSON<SessionUserInfo | null>(USER_INFO_KEY, null)

export const getAccount = () => getUserInfo()?.account || ''

export const getDisplayName = () => {
  const userInfo = getUserInfo()
  return userInfo?.name || userInfo?.userName || userInfo?.account || '用户'
}

export const clearUserInfo = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_INFO_KEY)
  sessionStorage.removeItem(USER_MENUS_KEY)
  sessionStorage.removeItem(USER_ROLE_CODE_KEY)
  sessionStorage.removeItem(USER_PERMISSIONS_KEY)
}

export const clearAuth = clearUserInfo

export const isLoggedIn = () => Boolean(getToken())

export const setUserMenus = (menus: any[]) => writeJSON(USER_MENUS_KEY, menus)

export const getUserMenus = () => readJSON<any[]>(USER_MENUS_KEY, [])

export const setUserRoleCode = (roleCode: string) => {
  sessionStorage.setItem(USER_ROLE_CODE_KEY, roleCode)
}

export const getUserRoleCode = () => sessionStorage.getItem(USER_ROLE_CODE_KEY) || ''

export const setUserPermissions = (permissions: string[]) => writeJSON(USER_PERMISSIONS_KEY, permissions)

export const getUserPermissions = () => readJSON<string[]>(USER_PERMISSIONS_KEY, [])

export const hasPermission = (permissionCode: string) => {
  const roleCode = getUserRoleCode()

  if (roleCode === 'ADMIN') {
    return true
  }

  return getUserPermissions().includes(permissionCode)
}

export const getTokenFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('token')
}

export const handleWechatCallback = () => {
  const token = getTokenFromUrl()

  if (!token) {
    return false
  }

  setToken(token)

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.user) {
      const userInfo = JSON.parse(payload.user)
      setUserInfo({ ...userInfo, token })
    }
  } catch (error) {
    console.error('解析 token 失败:', error)
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  window.history.replaceState({}, '', url.pathname + url.search)
  return true
}
