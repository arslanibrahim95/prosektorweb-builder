'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone, Mail } from 'lucide-react';

interface SiteHeaderProps {
  slug: string;
  companyName: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
}

const navLinks = [
  { href: '', label: 'Ana Sayfa' },
  { href: '/hakkimizda', label: 'Hakkimizda' },
  { href: '/hizmetler', label: 'Hizmetler' },
  { href: '/blog', label: 'Blog' },
  { href: '/iletisim', label: 'Iletisim' },
];

export function SiteHeader({ slug, companyName, logoUrl, phone, email }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const basePath = `/${slug}`;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      {(phone || email) && (
        <div className="bg-[var(--color-primary)] text-white">
          <div className="container mx-auto px-4 py-2 flex items-center justify-end gap-6 text-sm">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 hover:opacity-80">
                <Phone className="w-4 h-4" />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:opacity-80">
                <Mail className="w-4 h-4" />
                {email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main header */}
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={basePath} className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-12 w-auto" />
            ) : (
              <span className="text-2xl font-bold text-[var(--color-primary)]">{companyName}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`${basePath}${link.href}`}
                className="text-neutral-700 hover:text-[var(--color-primary)] font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href={`${basePath}/iletisim`}
            className="hidden md:inline-flex px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-secondary)] transition-colors"
          >
            Bize Ulasin
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={`${basePath}${link.href}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-700 hover:text-[var(--color-primary)] font-medium py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={`${basePath}/iletisim`}
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex justify-center px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium"
              >
                Bize Ulasin
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
