import { $get } from '@/utils/request'
import { consumeSseResponse, createSsePostRequest } from '@/shared/http/sse'

export interface BaziFortuneRequest {
  name?: string
  birthYear: number
  birthMonth: number
  birthDay: number
  birthTime: string
  calendarType?: 'lunar' | 'solar'
  leapMonth?: boolean
  gender: '男' | '女'
  question?: string
}

export interface BaziFortuneMeta {
  recordId: number
  calendarType?: 'lunar' | 'solar'
  yearPillar: string
  monthPillar: string
  dayPillar: string
  hourPillar?: string | null
  baZi: string
  zodiac: string
  shiChen?: string | null
  lunarText?: string | null
  solarTerm?: string | null
  solarDate?: string | null
}

export interface BaziFortuneHistoryItem {
  id: number
  gender: string
  birthDate: string
  birthTime: string
  leapMonth?: boolean
  baZi: string
  zodiac: string
  question?: string
  status: string
  createTime: string
}

export interface BaziFortuneDetail extends BaziFortuneHistoryItem {
  solarDate?: string | null
  solarTime?: string | null
  yearPillar: string
  monthPillar: string
  dayPillar: string
  hourPillar?: string | null
  shiChen?: string | null
  lunarText?: string | null
  fortuneContent: string
  errorMessage?: string | null
}

export interface BaziMarriagePersonRequest {
  name?: string
  birthYear: number
  birthMonth: number
  birthDay: number
  birthTime: string
  calendarType?: 'lunar' | 'solar'
  leapMonth?: boolean
  gender: '男' | '女'
}

export interface BaziMarriageRequest {
  personA: BaziMarriagePersonRequest
  personB: BaziMarriagePersonRequest
  question?: string
}

export interface BaziMarriagePersonMeta {
  name?: string
  gender: '男' | '女'
  birthDate: string
  birthTime: string
  calendarType?: 'lunar' | 'solar'
  leapMonth?: boolean
  solarDate?: string | null
  lunarText?: string | null
  zodiac: string
  baZi: string
  yearPillar: string
  monthPillar: string
  dayPillar: string
  hourPillar?: string | null
  shiChen?: string | null
  solarTerm?: string | null
}

export interface BaziMarriageMeta {
  recordId?: number
  personA: BaziMarriagePersonMeta
  personB: BaziMarriagePersonMeta
}

export interface BaziMarriageHistoryItem {
  id: number
  personAName?: string
  personBName?: string
  personABaZi?: string
  personBBaZi?: string
  question?: string
  status: string
  createTime: string
}

export interface BaziMarriageDetail {
  id: number
  personA: BaziMarriagePersonMeta
  personB: BaziMarriagePersonMeta
  question?: string
  fortuneContent: string
  status: string
  errorMessage?: string | null
  createTime: string
}

interface StreamHandlers {
  onMeta?: (meta: BaziFortuneMeta) => void
  onDelta?: (content: string) => void
  onDone?: (recordId: number) => void
  onError?: (message: string) => void
}

interface MarriageStreamHandlers {
  onMeta?: (meta: BaziMarriageMeta) => void
  onDelta?: (content: string) => void
  onDone?: (recordId: number | null, content: string) => void
  onError?: (message: string) => void
}

export const getBaziFortuneHistory = async () => {
  const ret = await $get('/bazi/fortune/history', {})
  return ret.code === 1 ? (ret.data as BaziFortuneHistoryItem[]) : []
}

export const getBaziFortuneDetail = async (id: number) => {
  const ret = await $get(`/bazi/fortune/detail/${id}`, {})
  return ret.code === 1 ? (ret.data as BaziFortuneDetail) : null
}

export const getBaziMarriageHistory = async () => {
  const ret = await $get('/bazi/marriage/history', {})
  return ret.code === 1 ? (ret.data as BaziMarriageHistoryItem[]) : []
}

export const getBaziMarriageDetail = async (id: number) => {
  const ret = await $get(`/bazi/marriage/detail/${id}`, {})
  return ret.code === 1 ? (ret.data as BaziMarriageDetail) : null
}

export const streamBaziFortune = async (payload: BaziFortuneRequest, handlers: StreamHandlers = {}) => {
  const response = await createSsePostRequest('/bazi/fortune/stream', payload)
  await consumeSseResponse(response, ({ event, data }) => {
    const payload = JSON.parse(data)
    if (event === 'meta') {
      handlers.onMeta?.(payload as BaziFortuneMeta)
    } else if (event === 'delta') {
      handlers.onDelta?.((payload as { content: string }).content || '')
    } else if (event === 'done') {
      handlers.onDone?.((payload as { recordId: number }).recordId)
    } else if (event === 'error') {
      handlers.onError?.((payload as { message: string }).message || '生成失败')
    }
  })
}

export const streamBaziMarriage = async (payload: BaziMarriageRequest, handlers: MarriageStreamHandlers = {}) => {
  const response = await createSsePostRequest('/bazi/marriage/stream', payload)
  await consumeSseResponse(response, ({ event, data }) => {
    const payload = JSON.parse(data)
    if (event === 'meta') {
      handlers.onMeta?.(payload as BaziMarriageMeta)
    } else if (event === 'delta') {
      handlers.onDelta?.((payload as { content: string }).content || '')
    } else if (event === 'done') {
      handlers.onDone?.((payload as { recordId?: number | null }).recordId ?? null, (payload as { content: string }).content || '')
    } else if (event === 'error') {
      handlers.onError?.((payload as { message: string }).message || '生成失败')
    }
  })
}
