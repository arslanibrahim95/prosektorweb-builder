'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Sparkles,
  Upload,
  RefreshCcw,
  CircleCheck,
  CircleAlert,
  Globe,
  FileText,
  Phone,
  Mail,
} from 'lucide-react'
import { getOsgbTemplateLabel, OSGB_INDUSTRY } from '@/features/projects/lib/osgb'

interface ProjectDetail {
  id: string
  name: string
  slug: string
  description: string | null
  template: string | null
  industry: string | null
  contact?: {
    phone: string | null
    email: string | null
    address: string | null
    city: string | null
    district: string | null
  }
  status: string
  progress: number
  createdAt: string
  updatedAt: string
  domain: { id: string; name: string } | null
  pagesCount: number
  generatedContentsCount: number
}

interface ProjectPage {
  id: string
  name: string
  slug: string
  content: string
  updatedAt: string
}

interface PublishResponse {
  success: boolean
  error?: string
  project?: ProjectDetail
  pagesPublished?: number
  qualityGate?: {
    qaScore: number
    threshold: number
    escalationLevel: 'none' | 'low' | 'medium' | 'high'
    forced: boolean
  }
  webhook?: {
    ok: boolean
    skipped?: boolean
    warning?: string
    traceId?: string
  }
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [pages, setPages] = useState<ProjectPage[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const publishedCount = useMemo(
    () => pages.filter((page) => page.content && page.content.trim().length > 0).length,
    [pages]
  )

  async function loadData() {
    const [projectRes, pagesRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`, { cache: 'no-store' }),
      fetch(`/api/projects/${projectId}/pages`, { cache: 'no-store' }),
    ])

    const [projectJson, pagesJson] = await Promise.all([projectRes.json(), pagesRes.json()])

    if (!projectRes.ok || !projectJson.success) {
      throw new Error(projectJson.error || 'Proje yuklenemedi')
    }

    if (!pagesRes.ok || !pagesJson.success) {
      throw new Error(pagesJson.error || 'Sayfalar yuklenemedi')
    }

    setProject(projectJson.project)
    setPages(Array.isArray(pagesJson.pages) ? pagesJson.pages : [])
  }

  useEffect(() => {
    let active = true

    async function run() {
      try {
        await loadData()
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Veriler yuklenemedi')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      active = false
    }
  }, [projectId])

  async function handleRefresh() {
    try {
      setRefreshing(true)
      setError(null)
      await loadData()
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Veriler yuklenemedi')
    } finally {
      setRefreshing(false)
    }
  }

  async function handlePublish() {
    try {
      setPublishing(true)
      setError(null)
      setMessage(null)

      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
      })

      const result = (await response.json()) as PublishResponse

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Yayinlama basarisiz')
      }

      if (result.project) {
        setProject(result.project)
      }

      await handleRefresh()

      const qaNote = result.qualityGate
        ? `QA ${result.qualityGate.qaScore}/${result.qualityGate.threshold} (${result.qualityGate.escalationLevel})`
        : 'QA notu yok'

      const webhookNote = result.webhook?.ok
        ? 'Webhook tamamlandi'
        : result.webhook?.warning || 'Webhook atlandi'

      setMessage(`Yayinlama tamamlandi (${result.pagesPublished ?? 0} sayfa). ${qaNote}. ${webhookNote}.`)
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Yayinlama basarisiz')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-4 py-10 text-slate-200">
        Proje yukleniyor...
      </main>
    )
  }

  if (error && !project) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100">
          {error}
        </div>
      </main>
    )
  }

  if (!project) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Projelere don
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <p className="max-w-3xl text-slate-300">
              {project.description || 'Aciklama bulunmuyor.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${projectId}/generate`}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <Sparkles className="h-4 w-4" />
              Icerik Uret
            </Link>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {publishing ? 'Yayinlaniyor...' : 'Yayinla'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/60"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Sablon</p>
            <p className="mt-2 font-semibold text-white">{getOsgbTemplateLabel(project.template)}</p>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Sektor</p>
            <p className="mt-2 font-semibold text-white">{project.industry || OSGB_INDUSTRY}</p>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Sayfalar</p>
            <p className="mt-2 font-semibold text-white">{pages.length} toplam, {publishedCount} icerikli</p>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Durum</p>
            <p className="mt-2 font-semibold text-white">{project.status}</p>
          </article>
        </section>

        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-4 text-lg font-semibold">Iletisim Bilgileri</h2>
          <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-2">
            <p className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan-300" />
              {project.contact?.phone || '-'}
            </p>
            <p className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-300" />
              {project.contact?.email || '-'}
            </p>
            <p className="inline-flex items-center gap-2 md:col-span-2">
              <Globe className="h-4 w-4 text-emerald-300" />
              {project.domain?.name || `${project.slug}.ornek-domain.com`}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-4 text-lg font-semibold">Sayfalar</h2>
          {pages.length === 0 ? (
            <p className="text-sm text-slate-300">Sayfa bulunamadi. Icerik uretimi adimini calistirin.</p>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <div key={page.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5">
                  <div>
                    <p className="font-medium text-white">{page.name}</p>
                    <p className="text-xs text-slate-400">/{page.slug || ''}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {page.content && page.content.trim().length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                        <CircleCheck className="h-3.5 w-3.5" />
                        Icerik var
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-amber-100">
                        <CircleAlert className="h-3.5 w-3.5" />
                        Bos
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-slate-200">
                      <FileText className="h-3.5 w-3.5" />
                      {new Date(page.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
