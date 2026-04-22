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
export const AUTH_CHANGED_EVENT = 'xbl-auth-changed'

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

function dispatchAuthChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT))
}

function getHashUrlParams() {
  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')
  if (queryIndex < 0) {
    return new URLSearchParams()
  }
  return new URLSearchParams(hash.slice(queryIndex + 1))
}

export const setToken = (token: string) => {
  sessionStorage.setItem(TOKEN_KEY, token)
  dispatchAuthChanged()
}

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || ''

export const setUserInfo = (userInfo: SessionUserInfo) => {
  writeJSON(USER_INFO_KEY, userInfo)

  if (userInfo.token) {
    setToken(userInfo.token)
    return
  }

  dispatchAuthChanged()
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
  dispatchAuthChanged()
}

export const clearAuth = clearUserInfo

export const isLoggedIn = () => Boolean(getToken())

export const setUserMenus = (menus: any[]) => {
  writeJSON(USER_MENUS_KEY, menus)
  dispatchAuthChanged()
}

export const getUserMenus = () => readJSON<any[]>(USER_MENUS_KEY, [])

export const setUserRoleCode = (roleCode: string) => {
  sessionStorage.setItem(USER_ROLE_CODE_KEY, roleCode)
  dispatchAuthChanged()
}

export const getUserRoleCode = () => sessionStorage.getItem(USER_ROLE_CODE_KEY) || ''

export const setUserPermissions = (permissions: string[]) => {
  writeJSON(USER_PERMISSIONS_KEY, permissions)
  dispatchAuthChanged()
}

export const getUserPermissions = () => readJSON<string[]>(USER_PERMISSIONS_KEY, [])

export const hasPermission = (permissionCode: string) => {
  const roleCode = getUserRoleCode()

  if (roleCode === 'ADMIN') {
    return true
  }

  return getUserPermissions().includes(permissionCode)
}

export const getTokenFromUrl = () => {
  return getUrlParam('token')
}

export const getUrlParam = (name: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  const searchValue = searchParams.get(name)
  if (searchValue) {
    return searchValue
  }

  const hashParams = getHashUrlParams()
  return hashParams.get(name)
}

export const removeUrlParam = (name: string) => {
  const url = new URL(window.location.href)
  url.searchParams.delete(name)

  const hash = url.hash || ''
  const queryIndex = hash.indexOf('?')
  if (queryIndex >= 0) {
    const hashPath = hash.slice(0, queryIndex)
    const hashParams = new URLSearchParams(hash.slice(queryIndex + 1))
    hashParams.delete(name)
    const hashQuery = hashParams.toString()
    url.hash = hashQuery ? `${hashPath}?${hashQuery}` : hashPath
  }

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export const addAuthChangeListener = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = () => {
    listener()
  }

  window.addEventListener(AUTH_CHANGED_EVENT, handler)
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler)
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

  removeUrlParam('token')
  return true
}
