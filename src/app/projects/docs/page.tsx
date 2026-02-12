import Link from 'next/link'

const layoutPages = [
  { slug: '/', title: 'Ana Sayfa' },
  { slug: '/hakkimizda', title: 'Hakkimizda' },
  { slug: '/hizmetler', title: 'Hizmetler' },
  { slug: '/iletisim', title: 'Iletisim' },
  { slug: '/blog', title: 'Blog' },
]

const sectionOrder = [
  'hero',
  'services',
  'about',
  'cta',
  'contact',
  'faq',
  'team',
  'stats',
  'gallery',
  'testimonials',
  'content',
]

export default function ProjectDocsPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 space-y-3">
          <Link href="/projects" className="text-sm text-cyan-300 hover:text-cyan-200">
            &lt;- Projelere don
          </Link>
          <h1 className="text-3xl font-semibold">Panel UI Docs</h1>
          <p className="max-w-3xl text-sm text-slate-300">
            Bu sayfa, panelden yonetilen UI ayarlarinin canli sitede nasil etkili oldugunu aciklar.
          </p>
        </div>

        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Desteklenen UI Ayarlari</h2>
          <ul className="space-y-2 text-sm text-slate-200">
            <li><code>navigation_links</code>: Header menu linkleri.</li>
            <li><code>footer_links</code>: Footer kisayol linkleri.</li>
            <li><code>header_cta_label</code> ve <code>header_cta_href</code>: Header butonu.</li>
            <li><code>theme_tokens</code>: Renk ve font tokenlari.</li>
            <li><code>layout_config</code>: Sayfa bazli bolum sirasini degistirme / bolum gizleme.</li>
            <li><code>section_variants</code>: Hero, services, about, cta, contact bolumlerinin stil varyanti.</li>
          </ul>
        </section>

        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Layout Config Kurali</h2>
          <p className="mb-3 text-sm text-slate-300">
            Her sayfa icin <code>sectionOrder</code> ve <code>hiddenSections</code> alanlari kullanilir.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {layoutPages.map((page) => (
              <article key={page.slug} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm">
                <p className="font-semibold text-white">{page.title}</p>
                <p className="mt-1 text-xs text-slate-400">Slug: {page.slug}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Gecerli bolum tipleri: {sectionOrder.join(', ')}
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Varyantlar</h2>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <p className="font-semibold text-white">hero</p>
              <p className="text-slate-300">default, spotlight, compact</p>
            </article>
            <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <p className="font-semibold text-white">services</p>
              <p className="text-slate-300">cards, list, compact</p>
            </article>
            <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <p className="font-semibold text-white">about</p>
              <p className="text-slate-300">default, card</p>
            </article>
            <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <p className="font-semibold text-white">cta</p>
              <p className="text-slate-300">banner, minimal</p>
            </article>
            <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <p className="font-semibold text-white">contact</p>
              <p className="text-slate-300">default, compact</p>
            </article>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-3 text-lg font-semibold">Yayin Akisi</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
            <li>Proje detay ekraninda UI ayarlarini guncelleyin ve kaydedin.</li>
            <li>Yayinla butonuna basin.</li>
            <li>Canli site sayfalarinda menu, tema, bolum sirasi ve varyant degisikliklerini kontrol edin.</li>
          </ol>
        </section>
      </div>
    </main>
  )
}
