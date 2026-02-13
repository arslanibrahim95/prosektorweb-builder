import { listProjectPages } from '@/features/projects/lib/project-layer'
import { apiError, apiSuccess } from '@/shared/lib/api-contract'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pages = await listProjectPages(id)
    return apiSuccess({ pages })
  } catch (error) {
    console.error('List project pages error:', error)
    const message = error instanceof Error ? error.message : 'Sayfalar yuklenemedi'
    return apiError({
      status: 500,
      code: 'PROJECT_PAGES_LIST_FAILED',
      error: message,
    })
  }
}
