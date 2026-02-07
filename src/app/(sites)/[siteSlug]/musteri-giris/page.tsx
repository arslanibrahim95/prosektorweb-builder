import { notFound } from 'next/navigation'

import { LoginForm } from './LoginFormClient'
import { getSiteData } from '@/features/sites/lib/site-data'

export default async function MusteriGirisPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params
  const siteData = await getSiteData(siteSlug)

  if (!siteData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
        <div className="text-center">
          {siteData.company.logoUrl && (
            <img
              className="mx-auto h-16 w-auto object-contain mb-4"
              src={siteData.company.logoUrl}
              alt={siteData.company.name}
            />
          )}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Müşteri Paneli Giriş</h2>
          <p className="mt-2 text-sm text-gray-600">{siteData.company.name} döküman yönetim sistemi</p>
        </div>
        <LoginForm siteSlug={siteSlug} />
      </div>
    </div>
  )
}
