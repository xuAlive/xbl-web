import { $get, $post } from "../utils/request"
import { message } from '@/shared/ui/feedback'

/**
 * 登录记录接口
 */
export interface LoginRecord {
  account: string
  ip: string
  address: string | null
  loginCount: number
  lastLoginTime: string
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  records: T[]
  total: number
}

/**
 * 省份统计
 */
export interface ProvinceStat {
  province: string
  count: number
}

/**
 * 登录地点统计（地图 + 饼形图）
 */
export interface LoginLocationStats {
  locations: LoginRecord[]
  provinceStats: ProvinceStat[]
}

/**
 * 获取登录记录（分页）
 * @param page 页码
 * @param size 每页大小
 * @param account 账号（可选）
 */
export const getLoginRecords = async (page: number = 1, size: number = 5, account?: string): Promise<PageResult<LoginRecord>> => {
  try {
    const params: Record<string, any> = { page, size }
    if (account) params.account = account
    const ret = await $get('/sys/getLoginRecords', params)

    if (ret.code === 1) {
      return ret.data as PageResult<LoginRecord>
    } else {
      message.error(ret.msg || '获取登录记录失败')
      return { records: [], total: 0 }
    }
  } catch (error) {
    console.error('获取登录记录失败:', error)
    message.error('获取登录记录失败')
    return { records: [], total: 0 }
  }
}

/**
 * 获取登录地点统计信息（地图 + 饼形图）
 * @param account 账号（可选）
 */
export const getLoginLocationStats = async (account?: string): Promise<LoginLocationStats> => {
  try {
    const params = account ? { account } : {}
    const ret = await $get('/sys/getLoginLocationStats', params)

    if (ret.code === 1) {
      return ret.data as LoginLocationStats
    } else {
      message.error(ret.msg || '获取登录统计失败')
      return { locations: [], provinceStats: [] }
    }
  } catch (error) {
    console.error('获取登录统计失败:', error)
    message.error('获取登录统计失败')
    return { locations: [], provinceStats: [] }
  }
}

/**
 * 用户注册
 * @param data 注册信息 { account, password, nickname }
 */
export const $register = async (data: { account: string; password: string; nickname: string }) => {
  try {
    const ret = await $post('/sys/register', data)
    if (ret.code === 1) {
      message.success('注册成功')
      return ret.data // 返回 token
    } else {
      message.error(ret.msg || '注册失败')
      return null
    }
  } catch (error) {
    console.error('注册失败:', error)
    message.error('注册失败')
    return null
  }
}
