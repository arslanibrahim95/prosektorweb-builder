'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Sparkles, Circle, CircleCheck, Loader2, AlertTriangle } from 'lucide-react'

interface ProjectDetail {
  name: string
  description: string | null
  contact?: {
    phone: string | null
    email: string | null
    address: string | null
    city: string | null
    district: string | null
  }
}

interface GenerationStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'error'
}

const initialSteps: GenerationStep[] = [
  { id: 'context', label: 'Sirket verileri okunuyor', status: 'pending' },
  { id: 'approval', label: 'AI agent onayi aliniyor', status: 'pending' },
  { id: 'pages', label: 'Temel sayfalar olusturuluyor', status: 'pending' },
  { id: 'blocks', label: 'Blok icerikleri uretiliyor', status: 'pending' },
  { id: 'seo', label: 'SEO alanlari dolduruluyor', status: 'pending' },
  { id: 'final', label: 'Panel kayitlari tamamlaniyor', status: 'pending' },
]

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function GenerateProjectPages() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [companyName, setCompanyName] = useState('')
  const [description, setDescription] = useState('')
  const [services, setServices] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const [steps, setSteps] = useState<GenerationStep[]>(initialSteps)
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDefaults() {
      try {
        const response = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok || !json.success) return

        const project = json.project as ProjectDetail
        if (!active) return

        setCompanyName((prev) => (prev.trim() ? prev : project.name || ''))
        setDescription((prev) => (prev.trim() ? prev : project.description || ''))
        setPhone((prev) => (prev.trim() ? prev : project.contact?.phone || ''))
        setEmail((prev) => (prev.trim() ? prev : project.contact?.email || ''))

        setAddress((prev) => {
          if (prev.trim()) return prev
          if (project.contact?.address) return project.contact.address
          const cityLine = [project.contact?.district, project.contact?.city].filter(Boolean).join(' / ')
          return cityLine || ''
        })
      } catch {
        // Best effort prefill.
      }
    }

    loadDefaults()

    return () => {
      active = false
    }
  }, [projectId])

  const formValid = useMemo(
    () => companyName.trim().length > 1 && description.trim().length > 10,
    [companyName, description]
  )

  async function handleGenerate() {
    if (!formValid) return

    setGenerating(true)
    setDone(false)
    setError(null)
    setSteps(initialSteps)

    try {
      for (let i = 0; i < initialSteps.length; i += 1) {
        setSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            status: index < i ? 'completed' : index === i ? 'running' : 'pending',
          }))
        )
        await wait(350)
      }

      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          description,
          services,
          phone,
          email,
          address,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Icerik uretimi basarisiz')
      }

      setSteps((prev) => prev.map((step) => ({ ...step, status: 'completed' })))
      setDone(true)
    } catch (generationError) {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: step.status === 'running' ? 'error' : step.status,
        }))
      )
      setError(generationError instanceof Error ? generationError.message : 'Icerik uretimi basarisiz')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#111827] text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="space-y-3">
            <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Proje detayina don
            </Link>
            <h1 className="text-3xl font-semibold">Sayfa Uretim Adimi</h1>
            <p className="text-slate-300">
              Bu adim dashboard veri modeline uyumlu ana sayfa, hakkimizda, hizmetler ve iletisim sayfalarini taslak olarak olusturur.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <h2 className="mb-4 text-lg font-semibold">Icerik Girdileri</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm text-slate-300">Firma adi *</span>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm text-slate-300">Firma tanimi *</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm text-slate-300">Hizmet listesi (opsiyonel)</span>
                <textarea
                  value={services}
                  onChange={(event) => setServices(event.target.value)}
                  rows={3}
                  placeholder="Her satira bir hizmet"
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">Telefon</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">E-posta</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm text-slate-300">Adres</span>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                />
              </label>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!formValid || generating}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'Uretiliyor...' : 'Uretimi Baslat'}
            </button>

            {done && !generating && (
              <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Sayfalar olusturuldu. Proje detayina donup yayinlama adimina gecebilirsiniz.
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <h2 className="mb-4 text-lg font-semibold">Uretim Durumu</h2>
          <div className="space-y-2.5">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                  step.status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                    : step.status === 'running'
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100'
                      : step.status === 'error'
                        ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                        : 'border-slate-700 bg-slate-950/40 text-slate-300'
                }`}
              >
                {step.status === 'completed' ? (
                  <CircleCheck className="h-4 w-4" />
                ) : step.status === 'running' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step.status === 'error' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {step.label}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
