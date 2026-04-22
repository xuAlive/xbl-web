export interface AppRuntimeConfig {
  BLOG_API_URL?: string
  CRAWLER_API_URL?: string
  SCHEDULE_API_URL?: string
  CALENDAR_API_URL?: string
  TIMESHEET_API_URL?: string
  LOGIN_BG_INDEX?: number
  LOGIN_BG_IMAGES?: string[]
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppRuntimeConfig
  }
}

const runtimeConfig = (): AppRuntimeConfig => window.__APP_CONFIG__ || {}
const API_PREFIX = '/xbl'
const BLOG_SERVICE_PATH = '/blog'
const CRAWLER_SERVICE_PATH = '/crawler'
const SCHEDULE_SERVICE_PATH = '/schedule'
const CALENDAR_SERVICE_PATH = '/calendar'
const TIMESHEET_SERVICE_PATH = '/timesheet'

const withFallback = (...values: Array<string | undefined>) =>
  values.find((value) => typeof value === 'string' && value.length > 0) || ''

const withApiPrefix = (path: string) => `${API_PREFIX}${path}`

const matchesServicePath = (url: string, servicePath: string) =>
  url.startsWith(servicePath) || url.startsWith(withApiPrefix(servicePath))

export function getBlogBaseURL() {
  return withFallback(
    runtimeConfig().BLOG_API_URL,
    import.meta.env.VITE_BLOG_API_URL,
    withApiPrefix(BLOG_SERVICE_PATH),
  )
}

export function getScheduleBaseURL() {
  return withFallback(
    runtimeConfig().SCHEDULE_API_URL,
    import.meta.env.VITE_SCHEDULE_API_URL,
    withApiPrefix(SCHEDULE_SERVICE_PATH),
  )
}

export function getCrawlerBaseURL() {
  return withFallback(
    runtimeConfig().CRAWLER_API_URL,
    import.meta.env.VITE_CRAWLER_API_URL,
    withApiPrefix(CRAWLER_SERVICE_PATH),
  )
}

export function getCalendarBaseURL() {
  return withFallback(
    runtimeConfig().CALENDAR_API_URL,
    import.meta.env.VITE_CALENDAR_API_URL,
    withApiPrefix(CALENDAR_SERVICE_PATH),
  )
}

export function getTimesheetBaseURL() {
  return withFallback(
    runtimeConfig().TIMESHEET_API_URL,
    import.meta.env.VITE_TIMESHEET_API_URL,
    withApiPrefix(TIMESHEET_SERVICE_PATH),
  )
}

export function resolveServiceBaseURL(url = '') {
  if (matchesServicePath(url, SCHEDULE_SERVICE_PATH)) {
    return ''
  }

  if (matchesServicePath(url, CRAWLER_SERVICE_PATH)) {
    return ''
  }

  if (matchesServicePath(url, CALENDAR_SERVICE_PATH)) {
    return ''
  }

  if (matchesServicePath(url, TIMESHEET_SERVICE_PATH)) {
    return ''
  }

  if (matchesServicePath(url, BLOG_SERVICE_PATH)) {
    return ''
  }

  return getBlogBaseURL()
}
