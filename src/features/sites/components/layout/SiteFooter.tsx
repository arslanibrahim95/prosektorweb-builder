import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

interface SiteFooterProps {
  slug: string;
  companyName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  workingHours: string | null;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  } | null;
  dynamicServices?: Array<{ name: string }>;
  footerDescription?: string | null;
}

const quickLinks = [
  { href: '', label: 'Ana Sayfa' },
  { href: '/hakkimizda', label: 'Hakkimizda' },
  { href: '/hizmetler', label: 'Hizmetler' },
  { href: '/blog', label: 'Blog' },
  { href: '/iletisim', label: 'Iletisim' },
];

const services = [
  'Is Sagligi ve Guvenligi',
  'Isg Egitimi',
  'Risk Degerlendirmesi',
  'Is Yeri Hekimligi',
  'Isyeri Hemsireligi',
  'Ortak Saglik Guvenligi Birimi',
];

export function SiteFooter({
  slug,
  companyName,
  phone,
  email,
  address,
  workingHours,
  socialMedia,
  dynamicServices,
  footerDescription,
}: SiteFooterProps) {
  const basePath = `/${slug}`;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{companyName}</h3>
            <p className="text-neutral-400 mb-6">
              {footerDescription || 'Is sagligi ve guvenligi alaninda profesyonel hizmetler sunuyoruz. Sizin ve calisanlarinizin guvenligi bizim onceliğimiz.'}
            </p>
            {socialMedia && (
              <div className="flex gap-3">
                {socialMedia.facebook && (
                  <a
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-neutral-800 rounded-lg hover:bg-[var(--color-primary)] transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {socialMedia.instagram && (
                  <a
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-neutral-800 rounded-lg hover:bg-[var(--color-primary)] transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {socialMedia.linkedin && (
                  <a
                    href={socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-neutral-800 rounded-lg hover:bg-[var(--color-primary)] transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {socialMedia.twitter && (
                  <a
                    href={socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-neutral-800 rounded-lg hover:bg-[var(--color-primary)] transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Hizli Baglantilar</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`${basePath}${link.href}`}
                    className="hover:text-[var(--color-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Hizmetlerimiz</h4>
            <ul className="space-y-3">
              {(dynamicServices && dynamicServices.length > 0
                ? dynamicServices.map(s => s.name)
                : services
              ).map((service) => (
                <li key={typeof service === 'string' ? service : service}>
                  <Link
                    href={`${basePath}/hizmetler`}
                    className="hover:text-[var(--color-primary)] transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Iletisim</h4>
            <ul className="space-y-4">
              {phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[var(--color-primary)] mt-0.5" />
                  <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[var(--color-primary)] mt-0.5" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                  <span>{address}</span>
                </li>
              )}
              {workingHours && (
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[var(--color-primary)] mt-0.5" />
                  <span>{workingHours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-neutral-500 text-sm">
              &copy; {currentYear} {companyName}. Tum haklari saklidir.
            </p>
            <p className="text-neutral-500 text-sm">
              <a
                href="https://prosektorweb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                ProsektorWeb
              </a>{' '}
              tarafindan gelistirildi
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
