import { NextResponse } from 'next/server'
import {
  submitContactForm,
  toPanelErrorResponse,
} from '@/features/site-engine/lib/public-form-proxy'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await submitContactForm({
      site_id: body.site_id || body.siteId || body.projectId,
      site_token: body.site_token || body.siteToken,
      full_name: body.full_name || body.fullName || body.name,
      email: body.email,
      phone: body.phone || '',
      subject: body.subject || '',
      message: body.message,
      kvkk_consent: body.kvkk_consent ?? body.kvkkConsent ?? true,
      honeypot: body.honeypot || '',
    })

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    const normalized = toPanelErrorResponse(error)
    return NextResponse.json(
      {
        success: false,
        error: normalized.body.message,
        code: normalized.body.code,
        details: normalized.body.details,
      },
      { status: normalized.status }
    )
  }
}
