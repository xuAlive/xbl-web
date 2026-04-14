export {
  getBlogBaseURL as getBaseURL,
  getCalendarBaseURL,
  getScheduleBaseURL,
  getTimesheetBaseURL,
} from '@/shared/config/runtime'

import { getBlogBaseURL } from '@/shared/config/runtime'

export const baseURL_test = getBlogBaseURL()
