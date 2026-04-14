export interface AppRuntimeConfig {
  BLOG_API_URL?: string
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

const withFallback = (...values: Array<string | undefined>) =>
  values.find((value) => typeof value === 'string' && value.length > 0) || ''

export function getBlogBaseURL() {
  return withFallback(
    runtimeConfig().BLOG_API_URL,
    import.meta.env.VITE_BLOG_API_URL,
    '/blog',
  )
}

export function getScheduleBaseURL() {
  return withFallback(
    runtimeConfig().SCHEDULE_API_URL,
    import.meta.env.VITE_SCHEDULE_API_URL,
    '/schedule',
  )
}

export function getCalendarBaseURL() {
  return withFallback(
    runtimeConfig().CALENDAR_API_URL,
    import.meta.env.VITE_CALENDAR_API_URL,
    '/calendar',
  )
}

export function getTimesheetBaseURL() {
  return withFallback(
    runtimeConfig().TIMESHEET_API_URL,
    import.meta.env.VITE_TIMESHEET_API_URL,
    '/timesheet',
  )
}

export function resolveServiceBaseURL(url = '') {
  if (url.startsWith('/schedule')) {
    return ''
  }

  if (url.startsWith('/calendar')) {
    return ''
  }

  if (url.startsWith('/timesheet')) {
    return ''
  }

  if (url.startsWith('/blog')) {
    return ''
  }

  return getBlogBaseURL()
}
