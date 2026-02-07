const memoryStore = new Map<string, { count: number; resetAt: number }>()

type RateLimitOptions = {
  limit: number
  windowSeconds: number
}

export async function getClientIp(): Promise<string> {
  return 'local'
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const existing = memoryStore.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    memoryStore.set(key, { count: 1, resetAt })
    return {
      success: true,
      remaining: Math.max(0, options.limit - 1),
      resetAt,
    }
  }

  existing.count += 1
  memoryStore.set(key, existing)

  return {
    success: existing.count <= options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  }
}
