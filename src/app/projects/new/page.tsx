'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Building2, MapPin, Phone, Mail, Wand2 } from 'lucide-react'
import { DEFAULT_OSGB_TEMPLATE, OSGB_INDUSTRY, OSGB_TEMPLATES } from '@/features/projects/lib/osgb'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState(DEFAULT_OSGB_TEMPLATE)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          template,
          industry: OSGB_INDUSTRY,
          contact: {
            phone,
            email,
            city,
            district,
            address,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Proje olusturulamadi')
      }

      router.push(`/projects/${result.project.id}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Proje olusturulamadi')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 space-y-3">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Projelere geri don
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Yeni Site Projesi Olustur</h1>
          <p className="text-slate-600">
            Dashboard veri modeli korunur. Asagidaki bilgilerle ilk taslak site olusur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5 text-cyan-700" />
              Sirket Bilgileri
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Proje Adi</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Orn: Altin OSGB Ankara"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Aciklama</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Firmanin sundugu hizmet kapsamini yazin"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Telefon</span>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0 5xx xxx xx xx"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">E-posta</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="info@firma.com"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Sehir</span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Ankara"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Ilce</span>
                <input
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  placeholder="Cankaya"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Adres</span>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={2}
                  placeholder="Acik adres"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
              <Wand2 className="h-5 w-5 text-amber-600" />
              Baslangic Semasi
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {OSGB_TEMPLATES.map((item) => {
                const active = template === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-100'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </button>
                )
              })}
            </div>
            <p className="mt-4 text-sm text-slate-600">Sektor: <strong>{OSGB_INDUSTRY}</strong></p>
          </section>

          <div className="flex items-center justify-end gap-3">
            <Link href="/projects" className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Vazgec
            </Link>
            <button
              disabled={loading || !name.trim()}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Olusturuluyor...' : 'Projeyi Olustur'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
