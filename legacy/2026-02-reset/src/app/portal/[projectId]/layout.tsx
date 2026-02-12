import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Palette,
  FileText,
  Image,
  Newspaper,
  Settings,
  ExternalLink,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

const navItems = [
  { href: '', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/mesajlar', icon: MessageSquare, label: 'Mesajlar' },
  { href: '/icerik', icon: FileText, label: 'İçerik' },
  { href: '/blog', icon: Newspaper, label: 'Blog' },
  { href: '/medya', icon: Image, label: 'Medya' },
  { href: '/tasarim', icon: Palette, label: 'Tasarım' },
  { href: '/ayarlar', icon: Settings, label: 'Ayarlar' },
];

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { projectId } = await params;

  const project = await prisma.webProject.findUnique({
    where: { id: projectId },
    include: {
      company: true,
      siteSettings: true,
    },
  });

  if (!project) {
    notFound();
  }

  const basePath = `/portal/${projectId}`;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="text-neutral-400 hover:text-neutral-600">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
            <div>
              <h1 className="font-bold text-neutral-900">{project.name}</h1>
              <p className="text-sm text-neutral-500">{project.company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {project.siteUrl && (
              <a
                href={project.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Siteyi Gor
              </a>
            )}
            <Link
              href={`/${project.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Onizleme
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-73px)] bg-white border-r border-neutral-200">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                className="flex items-center gap-3 px-4 py-3 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 rounded-xl transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Project Status */}
          <div className="p-4 mx-4 mt-4 bg-neutral-50 rounded-xl">
            <p className="text-xs text-neutral-500 mb-2">Proje Durumu</p>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  project.status === 'LIVE'
                    ? 'bg-green-500'
                    : project.status === 'DRAFT'
                    ? 'bg-neutral-400'
                    : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm font-medium text-neutral-700">
                {project.status === 'LIVE'
                  ? 'Yayinda'
                  : project.status === 'DRAFT'
                  ? 'Taslak'
                  : project.status === 'DESIGNING'
                  ? 'Tasarimda'
                  : project.status === 'DEVELOPMENT'
                  ? 'Gelistirmede'
                  : project.status === 'REVIEW'
                  ? 'Incelemede'
                  : project.status}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
