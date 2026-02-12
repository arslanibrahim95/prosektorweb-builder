import { NextRequest } from 'next/server'
import { handleRevalidateWebhook } from '@/features/site-engine/lib/revalidate-handler'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  return handleRevalidateWebhook(request)
}
