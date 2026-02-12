import { NextResponse } from 'next/server'
import {
  submitJobApplicationForm,
  toPanelErrorResponse,
} from '@/features/site-engine/lib/public-form-proxy'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await submitJobApplicationForm({
      site_id: body.site_id || body.siteId || body.projectId,
      site_token: body.site_token || body.siteToken,
      full_name: body.full_name || body.fullName,
      email: body.email,
      phone: body.phone || '',
      job_post_id: body.job_post_id || body.jobPostId,
      position: body.position || '',
      cover_letter: body.cover_letter || body.coverLetter || '',
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
