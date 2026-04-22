import { getToken } from '@/shared/auth/session'
import { resolveServiceBaseURL } from '@/shared/config/runtime'

export interface SseEventPayload {
  event: string
  data: string
}

export async function createSsePostRequest(path: string, payload: unknown) {
  const token = getToken()
  const response = await fetch(`${resolveServiceBaseURL()}${path}`, {
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
    throw new Error(extractSseErrorMessage(text) || `请求失败: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('浏览器不支持流式响应')
  }

  return response
}

export async function consumeSseResponse(
  response: Response,
  onEvent: (payload: SseEventPayload) => void,
) {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取流式响应')
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const parsed = consumeSseBuffer(buffer, onEvent)
    buffer = parsed.rest
    if (done) {
      break
    }
  }

  if (buffer.trim()) {
    consumeSseBuffer(`${buffer}\n\n`, onEvent)
  }
}

function consumeSseBuffer(
  buffer: string,
  onEvent: (payload: SseEventPayload) => void,
) {
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

    const data = dataLines.join('\n')
    if (!data) {
      continue
    }
    onEvent({ event, data })
  }

  return { rest }
}

function extractSseErrorMessage(text: string) {
  try {
    const payload = JSON.parse(text)
    return payload.codeMessage || payload.message || ''
  } catch {
    return text
  }
}
