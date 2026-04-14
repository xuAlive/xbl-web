import axios from 'axios'
import { message } from '@/shared/ui/feedback'

import { clearUserInfo, getToken } from '@/shared/auth/session'
import { resolveServiceBaseURL } from '@/shared/config/runtime'

const instance = axios.create({
  timeout: 300000,
})

const isMobileRuntime = () => window.location.pathname.includes('/mobile/') || document.body.classList.contains('xbl-mobile-app')

instance.interceptors.request.use(
  (config) => {
    const url = config.url || ''
    const token = getToken()

    if (!config.baseURL) {
      config.baseURL = resolveServiceBaseURL(url)
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      if (!isMobileRuntime()) {
        message.error('登录已过期，请重新登录')
      }
      clearUserInfo()

      if (isMobileRuntime()) {
        window.location.hash = '#/login'
      } else {
        window.location.hash = '#/'
      }
    } else if (status === 403) {
      message.warning(error.response?.data?.msg || error.response?.data?.codeMessage || '无权限执行此操作')
    }

    return Promise.reject(error)
  },
)

export const $get = async <T = any>(url: string, params: object = {}) => {
  const response = await instance.get<T>(url, { params })
  return response.data
}

export const $post = async <T = any>(url: string, data: unknown = {}) => {
  const response = await instance.post<T>(url, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

export default instance
