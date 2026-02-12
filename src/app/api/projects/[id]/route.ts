import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProject, updateProjectUiSettings } from '@/features/projects/lib/project-layer'

const updateProjectSchema = z.object({
  uiSettings: z
    .object({
      navigationLinks: z
        .array(
          z.object({
            label: z.string().trim().min(1),
            href: z.string().trim().min(1),
          })
        )
        .optional(),
      footerLinks: z
        .array(
          z.object({
            label: z.string().trim().min(1),
            href: z.string().trim().min(1),
          })
        )
        .optional(),
      headerCtaLabel: z.string().trim().nullable().optional(),
      headerCtaHref: z.string().trim().nullable().optional(),
      themeTokens: z
        .object({
          primaryColor: z.string().trim().optional(),
          secondaryColor: z.string().trim().optional(),
          accentColor: z.string().trim().optional(),
          backgroundColor: z.string().trim().optional(),
          fontHeading: z.string().trim().optional(),
          fontBody: z.string().trim().optional(),
        })
        .optional(),
      layoutConfig: z
        .object({
          pages: z
            .record(
              z.object({
                sectionOrder: z.array(z.string().trim().min(1)).optional(),
                hiddenSections: z.array(z.string().trim().min(1)).optional(),
              })
            )
            .optional(),
        })
        .optional(),
      sectionVariants: z.record(z.string().trim().min(1)).optional(),
    })
    .optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await getProject(id)

    if (!project) {
      return NextResponse.json({ success: false, error: 'Proje bulunamadi' }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Get project error:', error)
    const message = error instanceof Error ? error.message : 'Proje yuklenemedi'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const json = await request.json().catch(() => ({}))
    const payload = updateProjectSchema.parse(json)

    if (!payload.uiSettings) {
      return NextResponse.json(
        { success: false, error: 'Guncellenecek UI ayari bulunamadi' },
        { status: 400 }
      )
    }

    const project = await updateProjectUiSettings(id, payload.uiSettings)

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Patch project error:', error)
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message || 'Gecersiz guncelleme verisi'
        : error instanceof Error
          ? error.message
          : 'Proje guncellenemedi'

    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
