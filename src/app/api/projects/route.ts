import { createProject, listProjects } from '@/features/projects/lib/project-layer'
import { apiError, apiSuccess } from '@/shared/lib/api-contract'

export async function GET() {
  try {
    const projects = await listProjects()
    return apiSuccess({ projects })
  } catch (error) {
    console.error('Projects list error:', error)
    const message = error instanceof Error ? error.message : 'Projeler yuklenemedi'
    return apiError({
      status: 500,
      code: 'PROJECTS_LIST_FAILED',
      error: message,
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const project = await createProject(body)
    return apiSuccess({ project }, { status: 201 })
  } catch (error) {
    console.error('Create project error:', error)
    const message = error instanceof Error ? error.message : 'Proje olusturulamadi'
    return apiError({
      status: 400,
      code: 'PROJECT_CREATE_FAILED',
      error: message,
    })
  }
}
