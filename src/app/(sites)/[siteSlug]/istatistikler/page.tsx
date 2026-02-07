import { notFound } from 'next/navigation'

import { AnalyticsDashboard } from './AnalyticsDashboardClient'
import { getSiteData } from '@/features/sites/lib/site-data'

export default async function AnalyticsPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params
  const siteData = await getSiteData(siteSlug)

  if (!siteData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Site İstatistikleri</h1>
          <p className="mt-1 text-sm text-gray-500">
            {siteData.company.name} web sitesi performans raporu
          </p>
        </div>
        <AnalyticsDashboard projectId={String(siteData.project.id)} />
      </div>
    </div>
  )
}
