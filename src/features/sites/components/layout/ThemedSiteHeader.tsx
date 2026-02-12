'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Phone, Mail } from 'lucide-react'
import type { SiteNavigationLink } from '@/features/sites/lib/site-data'
import { normalizeSiteThemeId } from '@/features/sites/themes/types'

interface ThemedSiteHeaderProps {
  slug: string
  companyName: string
  logoUrl: string | null
  phone: string | null
  email: string | null
  themeId: string
  navigationLinks?: SiteNavigationLink[]
  ctaLabel?: string | null
  ctaHref?: string | null
}

const DEFAULT_NAV_LINKS: SiteNavigationLink[] = [
  { href: '', label: 'Ana Sayfa' },
  { href: '/hakkimizda', label: 'Hakkimizda' },
  { href: '/hizmetler', label: 'Hizmetler' },
  { href: '/blog', label: 'Blog' },
  { href: '/iletisim', label: 'Iletisim' },
]

function resolveNavigationLinks(navigationLinks?: SiteNavigationLink[]): SiteNavigationLink[] {
  if (!Array.isArray(navigationLinks) || navigationLinks.length === 0) {
    return DEFAULT_NAV_LINKS
  }
  return navigationLinks
}

function toRouteHref(basePath: string, href: string): string {
  const raw = href.trim()
  if (!raw || raw === '/') return basePath
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:')
  ) {
    return raw
  }
  if (raw.startsWith('#')) return `${basePath}${raw}`
  if (raw.startsWith('/')) return `${basePath}${raw}`
  return `${basePath}/${raw.replace(/^\/+/, '')}`
}

function resolveCtaHref(basePath: string, ctaHref: string | null | undefined): string {
  const raw = ctaHref?.trim() || '/iletisim'
  return toRouteHref(basePath, raw)
}

function resolveCtaLabel(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function HeaderBrand({
  basePath,
  companyName,
  logoUrl,
  textClass,
}: {
  basePath: string
  companyName: string
  logoUrl: string | null
  textClass: string
}) {
  return (
    <Link href={basePath} className="inline-flex items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={companyName} className="h-11 w-auto" />
      ) : (
        <span className={`text-xl font-semibold ${textClass}`}>{companyName}</span>
      )}
    </Link>
  )
}

function MobileMenu({
  open,
  onClose,
  basePath,
  className,
  linkClass,
  buttonClass,
  links,
  ctaLabel,
  ctaHref,
}: {
  open: boolean
  onClose: () => void
  basePath: string
  className: string
  linkClass: string
  buttonClass: string
  links: SiteNavigationLink[]
  ctaLabel: string
  ctaHref: string
}) {
  if (!open) return null

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 py-4">
        {links.map((link, index) => (
          <Link key={`${link.href}-${index}`} href={toRouteHref(basePath, link.href)} onClick={onClose} className={linkClass}>
            {link.label}
          </Link>
        ))}
        <Link href={ctaHref} onClick={onClose} className={buttonClass}>
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

function CorporateHeader(props: Omit<ThemedSiteHeaderProps, 'themeId'>) {
  const { slug, companyName, logoUrl, phone, email, navigationLinks, ctaLabel, ctaHref } = props
  const [open, setOpen] = useState(false)
  const basePath = `/${slug}`
  const links = resolveNavigationLinks(navigationLinks)
  const resolvedCtaLabel = resolveCtaLabel(ctaLabel, 'Bize Ulasin')
  const resolvedCtaHref = resolveCtaHref(basePath, ctaHref)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      {(phone || email) && (
        <div className="bg-[var(--color-primary)] text-white">
          <div className="container mx-auto flex items-center justify-end gap-5 px-4 py-2 text-sm">
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-2 hover:opacity-80">
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:opacity-80">
                <Mail className="h-4 w-4" />
                {email}
              </a>
            )}
          </div>
        </div>
      )}

      <nav className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-6">
          <HeaderBrand basePath={basePath} companyName={companyName} logoUrl={logoUrl} textClass="text-slate-900" />

          <div className="hidden items-center gap-7 md:flex">
            {links.map((link, index) => (
              <Link
                key={`${link.href}-${index}`}
                href={toRouteHref(basePath, link.href)}
                className="text-sm font-medium text-slate-700 transition hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href={resolvedCtaHref}
            className="hidden rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-secondary)] md:inline-flex"
          >
            {resolvedCtaLabel}
          </Link>

          <button
            onClick={() => setOpen((value) => !value)}
            className="inline-flex p-2 text-slate-700 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <MobileMenu
          open={open}
          onClose={() => setOpen(false)}
          basePath={basePath}
          className="md:hidden"
          linkClass="rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-100"
          buttonClass="mt-1 inline-flex justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
          links={links}
          ctaHref={resolvedCtaHref}
          ctaLabel={resolvedCtaLabel}
        />
      </nav>
    </header>
  )
}

function IndustrialHeader(props: Omit<ThemedSiteHeaderProps, 'themeId'>) {
  const { slug, companyName, logoUrl, phone, email, navigationLinks, ctaLabel, ctaHref } = props
  const [open, setOpen] = useState(false)
  const basePath = `/${slug}`
  const links = resolveNavigationLinks(navigationLinks)
  const resolvedCtaLabel = resolveCtaLabel(ctaLabel, 'Teklif Al')
  const resolvedCtaHref = resolveCtaHref(basePath, ctaHref)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1020] text-slate-100">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4 border-b border-white/10">
          <HeaderBrand basePath={basePath} companyName={companyName} logoUrl={logoUrl} textClass="text-white" />
          <div className="hidden items-center gap-7 md:flex">
            {links.map((link, index) => (
              <Link
                key={`${link.href}-${index}`}
                href={toRouteHref(basePath, link.href)}
                className="text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <button
            onClick={() => setOpen((value) => !value)}
            className="inline-flex p-2 text-slate-100 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div className="flex items-center justify-between py-3 text-xs text-slate-300">
          <div className="hidden items-center gap-4 sm:flex">
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </a>
            )}
          </div>

          <Link
            href={resolvedCtaHref}
            className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            {resolvedCtaLabel}
          </Link>
        </div>

        <MobileMenu
          open={open}
          onClose={() => setOpen(false)}
          basePath={basePath}
          className="border-t border-white/10 md:hidden"
          linkClass="rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-white/10"
          buttonClass="inline-flex justify-center rounded-md bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white"
          links={links}
          ctaHref={resolvedCtaHref}
          ctaLabel={resolvedCtaLabel}
        />
      </div>
    </header>
  )
}

function EditorialHeader(props: Omit<ThemedSiteHeaderProps, 'themeId'>) {
  const { slug, companyName, logoUrl, navigationLinks, ctaLabel, ctaHref } = props
  const [open, setOpen] = useState(false)
  const basePath = `/${slug}`
  const links = resolveNavigationLinks(navigationLinks)
  const resolvedCtaLabel = resolveCtaLabel(ctaLabel, 'Iletisim')
  const resolvedCtaHref = resolveCtaHref(basePath, ctaHref)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#fdfcf8]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <HeaderBrand basePath={basePath} companyName={companyName} logoUrl={logoUrl} textClass="text-slate-900" />

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link, index) => (
            <Link
              key={`${link.href}-${index}`}
              href={toRouteHref(basePath, link.href)}
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={resolvedCtaHref}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-900 hover:text-slate-900"
          >
            {resolvedCtaLabel}
          </Link>
        </div>

        <button
          onClick={() => setOpen((value) => !value)}
          className="inline-flex p-2 text-slate-700 md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <div className="mx-auto max-w-5xl px-4">
        <MobileMenu
          open={open}
          onClose={() => setOpen(false)}
          basePath={basePath}
          className="border-t border-slate-200 md:hidden"
          linkClass="rounded-md px-2 py-2 text-slate-700 hover:bg-slate-100"
          buttonClass="inline-flex justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900"
          links={links}
          ctaHref={resolvedCtaHref}
          ctaLabel={resolvedCtaLabel}
        />
      </div>
    </header>
  )
}

export function ThemedSiteHeader(props: ThemedSiteHeaderProps) {
  const themeId = normalizeSiteThemeId(props.themeId)

  if (themeId === 'industrial-bold') {
    return <IndustrialHeader {...props} />
  }

  if (themeId === 'minimal-editorial') {
    return <EditorialHeader {...props} />
  }

  return <CorporateHeader {...props} />
}
