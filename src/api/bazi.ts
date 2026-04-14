import { $get } from '@/utils/request'
import { getToken } from '@/shared/auth/session'
import { resolveServiceBaseURL } from '@/shared/config/runtime'

export interface BaziFortuneRequest {
  birthYear: number
  birthMonth: number
  birthDay: number
  birthTime: string
  leapMonth?: boolean
  gender: '男' | '女'
  question?: string
}

export interface BaziFortuneMeta {
  recordId: number
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

interface StreamHandlers {
  onMeta?: (meta: BaziFortuneMeta) => void
  onDelta?: (content: string) => void
  onDone?: (recordId: number) => void
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

export const streamBaziFortune = async (payload: BaziFortuneRequest, handlers: StreamHandlers = {}) => {
  const token = getToken()
  const response = await fetch(`${resolveServiceBaseURL()}/bazi/fortune/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(extractErrorMessage(text) || `请求失败: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('浏览器不支持流式响应')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const parsed = consumeSseBuffer(buffer, handlers)
    buffer = parsed.rest
    if (done) {
      break
    }
  }

  if (buffer.trim()) {
    consumeSseBuffer(`${buffer}\n\n`, handlers)
  }
}

function consumeSseBuffer(buffer: string, handlers: StreamHandlers) {
  const chunks = buffer.replace(/\r\n/g, '\n').split('\n\n')
  const rest = chunks.pop() || ''

  for (const chunk of chunks) {
    let event = 'message'
    const dataLines: string[] = []
    for (const line of chunk.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    const payloadText = dataLines.join('\n')
    if (!payloadText) {
      continue
    }

    const payload = JSON.parse(payloadText)
    if (event === 'meta') {
      handlers.onMeta?.(payload as BaziFortuneMeta)
    } else if (event === 'delta') {
      handlers.onDelta?.((payload as { content: string }).content || '')
    } else if (event === 'done') {
      handlers.onDone?.((payload as { recordId: number }).recordId)
    } else if (event === 'error') {
      handlers.onError?.((payload as { message: string }).message || '生成失败')
    }
  }

  return { rest }
}

function extractErrorMessage(text: string) {
  try {
    const payload = JSON.parse(text)
    return payload.codeMessage || payload.message || ''
  } catch {
    return text
  }
}
