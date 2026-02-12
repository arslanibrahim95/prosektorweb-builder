import { NextResponse } from 'next/server'
import {
  submitContactForm,
  toPanelErrorResponse,
} from '@/features/site-engine/lib/public-form-proxy'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await submitContactForm(body)
    return NextResponse.json(response)
  } catch (error) {
    const normalized = toPanelErrorResponse(error)
    return NextResponse.json(normalized.body, { status: normalized.status })
  }
}
