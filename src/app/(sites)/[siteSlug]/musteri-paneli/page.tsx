import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { LogOut, ShieldCheck } from 'lucide-react'

import { ClientDocumentsList } from './ClientDocumentsList'
import { getSiteData } from '@/features/sites/lib/site-data'

type PortalSiteData = {
  company: {
    name: string
    logoUrl?: string | null
  }
  settings: {
    email?: string | null
  }
}

export default async function MusteriPaneliPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params
  const siteData = await getSiteData(siteSlug)

  if (!siteData) {
    notFound()
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect(`/${siteSlug}/musteri-giris`)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PortalHeader siteData={siteData} siteSlug={siteSlug} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">Hesap Durumu</h3>
                  <p className="text-xs text-green-600 font-medium">Aktif</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                Hoşgeldiniz. Firmanıza özel İSG dökümanlarına, raporlara ve sertifikalara buradan
                erişebilirsiniz.
              </p>
              <div className="border-t border-neutral-100 pt-4 text-xs text-neutral-500">
                Teknik Destek:
                <br />
                <a href={`mailto:${siteData.settings.email || ''}`} className="text-blue-600 hover:underline">
                  {siteData.settings.email || 'destek@example.com'}
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <ClientDocumentsList />
          </div>
        </div>
      </main>
    </div>
  )
}

function PortalHeader({ siteData, siteSlug }: { siteData: PortalSiteData; siteSlug: string }) {
  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={`/${siteSlug}`} className="flex items-center gap-3">
          {siteData.company.logoUrl ? (
            <img
              src={siteData.company.logoUrl}
              alt={siteData.company.name}
              className="h-10 w-auto object-contain"
            />
          ) : null}
          <div>
            <p className="text-sm text-neutral-500">Müşteri Paneli</p>
            <h1 className="font-semibold text-neutral-900">{siteData.company.name}</h1>
          </div>
        </Link>

        <Link
          href={`/${siteSlug}/musteri-giris`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış
        </Link>
      </div>
    </header>
  )
}
