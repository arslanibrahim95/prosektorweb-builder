import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-900 to-emerald-900 text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/20 bg-black/20 p-10 backdrop-blur">
          <h1 className="text-4xl font-bold tracking-tight">OSGB Site Engine</h1>
          <p className="mt-4 text-lg text-slate-200">
            Bu uygulama OSGB sitelerini render eder ve dashboard bagli site olusturma akislarini sunar.
            Icerik duzenleme panel tarafinda yapilir, yayin tetiklemesi `POST /api/internal/publish` ile bu servise gelir.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <p>
              Örnek site yolu: <code className="rounded bg-white/10 px-2 py-1">/firma-slug</code>
            </p>
            <p>
              Publish endpoint: <code className="rounded bg-white/10 px-2 py-1">/api/internal/publish</code>
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/projects"
              className="inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Site Olusturma Akisini Ac
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
