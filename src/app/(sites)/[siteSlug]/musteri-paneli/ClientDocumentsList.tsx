'use client'

import { useEffect, useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'

interface ClientDoc {
  id: string
  title: string
  category: string
  url?: string
  filename?: string
  createdAt: string
  status: string
  validUntil?: string
}

type ClientDocumentsResponse = {
  docs?: ClientDoc[]
}

export function ClientDocumentsList() {
  const [docs, setDocs] = useState<ClientDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDocs() {
      try {
        const response = await fetch('/api/client-documents?limit=100')

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Yetkisiz erişim')
          }
          throw new Error('Dökümanlar yüklenemedi')
        }

        const data = (await response.json()) as ClientDocumentsResponse
        setDocs(data.docs || [])
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : 'Bir hata oluştu'
        console.error(unknownError)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchDocs()
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        Yükleniyor...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-white rounded-xl border border-red-200">
        {error}
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Henüz Belge Yok</h3>
        <p className="text-neutral-500">Firmanız adına yüklenmiş bir döküman bulunmamaktadır.</p>
      </div>
    )
  }

  const categoryLabels: Record<string, string> = {
    report: 'İSG Raporu',
    'risk-analysis': 'Risk Analizi',
    'training-cert': 'Eğitim Belgesi',
    contract: 'Sözleşme/Fatura',
    other: 'Diğer',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="font-bold text-lg text-neutral-900">Dökümanlarım</h2>
      </div>
      <div className="divide-y divide-neutral-100">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="p-6 flex items-start justify-between hover:bg-neutral-50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                  {doc.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                  <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 border border-neutral-200">
                    {categoryLabels[doc.category] || doc.category}
                  </span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</span>
                  {doc.validUntil ? (
                    <span className="text-orange-600">
                      Geçerlilik: {new Date(doc.validUntil).toLocaleDateString('tr-TR')}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <a
              href={doc.url || `/api/client-documents/file/${doc.id}`}
              className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="İndir"
              target="_blank"
              rel="noreferrer"
              download
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
