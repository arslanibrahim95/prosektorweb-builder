export interface OpenAIResponsesPayload {
  model: string
  input: Array<{
    role: 'system' | 'user'
    content: Array<{ type: 'input_text'; text: string }>
  }>
  temperature?: number
  max_output_tokens?: number
}

function getApiBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
}

export function getOpenAIApiKey(): string | null {
  const raw = process.env.OPENAI_API_KEY
  if (!raw) return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function callOpenAIResponses(
  payload: OpenAIResponsesPayload,
  signal?: AbortSignal
): Promise<unknown> {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY tanimli degil')
  }

  const response = await fetch(`${getApiBaseUrl()}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    throw new Error(`OpenAI Responses API hatasi: ${response.status} ${bodyText.slice(0, 200)}`)
  }

  return response.json()
}

export function extractOpenAIOutputText(bodyData: unknown): string {
  if (!bodyData || typeof bodyData !== 'object') return ''

  const record = bodyData as Record<string, unknown>
  if (typeof record.output_text === 'string' && record.output_text.trim()) {
    return record.output_text
  }

  const output = record.output
  if (!Array.isArray(output)) return ''

  const chunks: string[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const itemRecord = item as Record<string, unknown>
    const content = itemRecord.content
    if (!Array.isArray(content)) continue

    for (const block of content) {
      if (!block || typeof block !== 'object') continue
      const blockRecord = block as Record<string, unknown>

      if (typeof blockRecord.text === 'string' && blockRecord.text.trim()) {
        chunks.push(blockRecord.text)
      }

      const maybeText = blockRecord.output_text
      if (typeof maybeText === 'string' && maybeText.trim()) {
        chunks.push(maybeText)
      }
    }
  }

  return chunks.join('\n').trim()
}

export function extractFirstJsonObject(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const firstBrace = trimmed.indexOf('{')
  if (firstBrace < 0) return ''

  let depth = 0
  let inString = false
  let escaping = false

  for (let index = firstBrace; index < trimmed.length; index += 1) {
    const char = trimmed[index]

    if (inString) {
      if (escaping) {
        escaping = false
      } else if (char === '\\') {
        escaping = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return trimmed.slice(firstBrace, index + 1)
      }
    }
  }

  return ''
}
