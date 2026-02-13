import { z } from 'zod'
import { getProject, updateProjectUiSettings } from '@/features/projects/lib/project-layer'
import { apiError, apiSuccess } from '@/shared/lib/api-contract'

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
      return apiError({
        status: 404,
        code: 'PROJECT_NOT_FOUND',
        error: 'Proje bulunamadi',
      })
    }

    return apiSuccess({ project })
  } catch (error) {
    console.error('Get project error:', error)
    const message = error instanceof Error ? error.message : 'Proje yuklenemedi'
    return apiError({
      status: 500,
      code: 'PROJECT_FETCH_FAILED',
      error: message,
    })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const json = await request.json().catch(() => ({}))
    const bodyData = updateProjectSchema.parse(json)

    if (!bodyData.uiSettings) {
      return apiError({
        status: 400,
        code: 'PROJECT_UI_SETTINGS_MISSING',
        error: 'Guncellenecek UI ayari bulunamadi',
      })
    }

    const project = await updateProjectUiSettings(id, bodyData.uiSettings)

    return apiSuccess({ project })
  } catch (error) {
    console.error('Patch project error:', error)
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message || 'Gecersiz guncelleme verisi'
        : error instanceof Error
          ? error.message
          : 'Proje guncellenemedi'

    return apiError({
      status: 400,
      code: error instanceof z.ZodError ? 'INVALID_REQUEST' : 'PROJECT_UPDATE_FAILED',
      error: message,
    })
  }
}
