import { NextResponse } from 'next/server'
import {
  submitOfferForm,
  toPanelErrorResponse,
} from '@/features/site-engine/lib/public-form-proxy'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const employeeCountRaw = body.employee_count ?? body.employeeCount
    const employeeCount =
      employeeCountRaw === null || employeeCountRaw === undefined || employeeCountRaw === ''
        ? null
        : Number(employeeCountRaw)

    const response = await submitOfferForm({
      site_id: body.site_id || body.siteId || body.projectId,
      site_token: body.site_token || body.siteToken,
      company_name: body.company_name || body.companyName,
      contact_name: body.contact_name || body.contactName,
      email: body.email,
      phone: body.phone,
      employee_count: Number.isFinite(employeeCount) ? employeeCount : null,
      hazard_class: body.hazard_class || body.hazardClass || 'unknown',
      services_requested: body.services_requested || body.servicesRequested || [],
      message: body.message || '',
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
