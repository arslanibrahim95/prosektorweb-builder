import Link from 'next/link'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { normalizeSiteThemeId } from '@/features/sites/themes/types'

interface ThemedSiteFooterProps {
  slug: string
  companyName: string
  phone: string | null
  email: string | null
  address: string | null
  workingHours: string | null
  socialMedia: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
  } | null
  dynamicServices?: Array<{ name: string }>
  footerDescription?: string | null
  themeId: string
}

const quickLinks = [
  { href: '', label: 'Ana Sayfa' },
  { href: '/hakkimizda', label: 'Hakkimizda' },
  { href: '/hizmetler', label: 'Hizmetler' },
  { href: '/blog', label: 'Blog' },
  { href: '/iletisim', label: 'Iletisim' },
]

const fallbackServices = [
  'Is Sagligi ve Guvenligi',
  'Is Yeri Hekimligi',
  'Risk Degerlendirmesi',
  'ISG Egitimleri',
]

function CorporateFooter(props: Omit<ThemedSiteFooterProps, 'themeId'>) {
  const {
    slug,
    companyName,
    phone,
    email,
    address,
    workingHours,
    dynamicServices,
    footerDescription,
  } = props
  const basePath = `/${slug}`
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-[#0f172a] text-slate-300">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{companyName}</h3>
          <p className="mt-3 text-sm text-slate-300">
            {footerDescription ||
              'Is sagligi ve guvenligi alaninda mevzuata uyumlu ve uygulamaya donuk hizmet sunuyoruz.'}
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-white">Baglantilar</h4>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={`${basePath}${link.href}`} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-white">Hizmetler</h4>
          <ul className="space-y-2 text-sm">
            {(dynamicServices && dynamicServices.length > 0
              ? dynamicServices.map((service) => service.name)
              : fallbackServices
            ).map((service) => (
              <li key={service}>
                <Link href={`${basePath}/hizmetler`} className="hover:text-white">
                  {service}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold text-white">Iletisim</h4>
          <ul className="space-y-3 text-sm">
            {phone && (
              <li className="inline-flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                {phone}
              </li>
            )}
            {email && (
              <li className="inline-flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                {email}
              </li>
            )}
            {address && (
              <li className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                {address}
              </li>
            )}
            {workingHours && (
              <li className="inline-flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                {workingHours}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        (c) {year} {companyName}
      </div>
    </footer>
  )
}

function IndustrialFooter(props: Omit<ThemedSiteFooterProps, 'themeId'>) {
  const {
    slug,
    companyName,
    phone,
    email,
    address,
    dynamicServices,
    footerDescription,
  } = props
  const basePath = `/${slug}`
  const year = new Date().getFullYear()

  const services =
    dynamicServices && dynamicServices.length > 0
      ? dynamicServices.map((service) => service.name)
      : fallbackServices

  return (
    <footer className="mt-10 border-t border-white/10 bg-[#060b15] text-slate-200">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-xl font-bold uppercase tracking-wide text-white">{companyName}</h3>
            <p className="mt-3 text-sm text-slate-300">
              {footerDescription || 'Saha odakli OSGB operasyonlari, raporlama ve surec takibi tek merkezden yonetilir.'}
            </p>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-100">Kisayollar</h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={`${basePath}${link.href}`} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-100">Iletisim</h4>
            <ul className="space-y-2 text-sm">
              {phone && <li>{phone}</li>}
              {email && <li>{email}</li>}
              {address && <li>{address}</li>}
            </ul>
          </article>
        </div>

        <div className="mb-7 rounded-xl border border-white/10 bg-white/5 p-5">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-100">Hizmet Basliklari</h4>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <Link
                key={service}
                href={`${basePath}/hizmetler`}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                {service}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">(c) {year} {companyName}</p>
      </div>
    </footer>
  )
}

function EditorialFooter(props: Omit<ThemedSiteFooterProps, 'themeId'>) {
  const { slug, companyName, phone, email, address, dynamicServices, footerDescription } = props
  const basePath = `/${slug}`
  const year = new Date().getFullYear()

  return (
    <footer className="mt-14 border-t border-slate-200 bg-[#fdfcf8] text-slate-700">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <article className="md:col-span-2">
            <h3 className="text-xl font-semibold text-slate-900">{companyName}</h3>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              {footerDescription || 'Isletmeler icin sade, okunabilir ve guven veren OSGB icerik yapisi.'}
            </p>
          </article>

          <article>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-900">Iletisim</h4>
            <ul className="space-y-2 text-sm">
              {phone && <li>{phone}</li>}
              {email && <li>{email}</li>}
              {address && <li>{address}</li>}
            </ul>
          </article>
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-8 md:grid-cols-2">
          <ul className="flex flex-wrap gap-3 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={`${basePath}${link.href}`} className="hover:text-slate-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="flex flex-wrap justify-start gap-2 text-xs md:justify-end">
            {(dynamicServices && dynamicServices.length > 0
              ? dynamicServices.map((service) => service.name)
              : fallbackServices
            ).map((service) => (
              <li key={service}>
                <Link href={`${basePath}/hizmetler`} className="rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200">
                  {service}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-slate-500">(c) {year} {companyName}</p>
      </div>
    </footer>
  )
}

export function ThemedSiteFooter(props: ThemedSiteFooterProps) {
  const themeId = normalizeSiteThemeId(props.themeId)

  if (themeId === 'industrial-bold') {
    return <IndustrialFooter {...props} />
  }

  if (themeId === 'minimal-editorial') {
    return <EditorialFooter {...props} />
  }

  return <CorporateFooter {...props} />
}
