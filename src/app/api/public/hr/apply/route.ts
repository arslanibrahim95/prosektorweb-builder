import { NextResponse } from 'next/server'
import {
  submitJobApplicationForm,
  toPanelErrorResponse,
} from '@/features/site-engine/lib/public-form-proxy'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await submitJobApplicationForm(body)
    return NextResponse.json(response)
  } catch (error) {
    const normalized = toPanelErrorResponse(error)
    return NextResponse.json(normalized.body, { status: normalized.status })
  }
}
