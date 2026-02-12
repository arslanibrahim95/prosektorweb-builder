'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Plus, Sparkles, Globe, Clock } from 'lucide-react'
import { getOsgbTemplateLabel, OSGB_INDUSTRY } from '@/features/projects/lib/osgb'

interface ProjectListItem {
  id: string
  name: string
  description: string | null
  template: string | null
  industry: string | null
  status: string
  updatedAt: string
}

function statusClass(status: string): string {
  if (status === 'LIVE' || status === 'PUBLISHED') return 'bg-emerald-400/20 text-emerald-200 ring-emerald-300/30'
  if (status === 'REVIEW') return 'bg-amber-300/20 text-amber-100 ring-amber-200/30'
  if (status === 'DEVELOPMENT' || status === 'DESIGNING') return 'bg-cyan-300/20 text-cyan-100 ring-cyan-200/30'
  if (status === 'CANCELLED') return 'bg-rose-400/20 text-rose-100 ring-rose-300/30'
  return 'bg-slate-200/20 text-slate-100 ring-slate-100/20'
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Taslak',
    PLANNING: 'Planlama',
    DESIGNING: 'Tasarim',
    DEVELOPMENT: 'Gelistirme',
    REVIEW: 'Inceleme',
    LIVE: 'Yayinda',
    PUBLISHED: 'Yayinda',
    CANCELLED: 'Iptal',
  }

  return labels[status] || status
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch('/api/projects', { cache: 'no-store' })
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Projeler yuklenemedi')
        }

        if (active) {
          setProjects(Array.isArray(result.projects) ? result.projects : [])
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Projeler yuklenemedi')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const empty = useMemo(() => !loading && !error && projects.length === 0, [loading, error, projects.length])

  return (
    <main className="relative isolate min-h-screen bg-[#0b1220] text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.16),transparent_30%),linear-gradient(160deg,#0b1220_0%,#111827_50%,#0f172a_100%)]" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Ana sayfaya don
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">Site Olusturma Paneli</h1>
            <p className="max-w-2xl text-slate-300">
              Dashboard veri modeline bagli projeleri yonet, otomatik sayfa uret ve yayinla.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/projects/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-700/60"
            >
              Panel Docs
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-900/40 transition hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              Yeni Proje
            </Link>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-8 text-slate-300">
            Projeler yukleniyor...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </div>
        )}

        {empty && (
          <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-900/50 p-10 text-center">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
            <p className="text-lg font-medium">Henuz proje yok</p>
            <p className="mt-2 text-sm text-slate-400">Ilk siteni olusturarak akisi baslatabilirsin.</p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-lg font-semibold text-white">{project.name}</h2>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                </div>

                <p className="mb-5 line-clamp-3 min-h-[56px] text-sm text-slate-300">
                  {project.description || 'Aciklama bulunmuyor'}
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                    {getOsgbTemplateLabel(project.template)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-amber-300" />
                    {project.industry || OSGB_INDUSTRY}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-emerald-300" />
                    {new Date(project.updatedAt).toLocaleString('tr-TR')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
