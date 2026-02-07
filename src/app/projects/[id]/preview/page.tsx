'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Monitor, Tablet, Smartphone, RotateCcw, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface ProjectPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  updatedAt: string;
}

const deviceWidths: Record<DeviceType, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.65; color: #111827; margin: 0; }
    main { max-width: 960px; margin: 0 auto; padding: 48px 20px 80px; }
    h1, h2, h3 { color: #111827; margin-top: 1.2em; }
    p { color: #374151; }
    ul { color: #374151; }
    a { color: #4338ca; text-decoration: none; }
  </style>
</head>
<body>
  <main>${body || '<p>İçerik bulunamadı.</p>'}</main>
</body>
</html>`;
}

export default function PreviewPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [device, setDevice] = useState<DeviceType>('desktop');
  const [key, setKey] = useState(0);
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPages() {
      try {
        const response = await fetch(`/api/projects/${projectId}/pages`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Sayfalar yüklenemedi');
        }

        const loadedPages: ProjectPage[] = result.pages || [];

        if (!active) return;

        setPages(loadedPages);
        if (loadedPages.length > 0) {
          setSelectedPageId(loadedPages[0].id);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Sayfalar yüklenemedi');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPages();

    return () => {
      active = false;
    };
  }, [projectId]);

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || pages[0] || null, [pages, selectedPageId]);

  const previewHtml = useMemo(() => wrapHtml(selectedPage?.name || 'Önizleme', selectedPage?.content || ''), [selectedPage]);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleExport = () => {
    if (!selectedPage) return;

    const slugPart = (selectedPage.slug || '')
      .replace(/^\/+/, '')
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const baseName = slugPart || 'index';

    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${baseName}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const DeviceButton = ({ type, icon: Icon }: { type: DeviceType; icon: typeof Monitor }) => (
    <Button variant={device === type ? 'default' : 'ghost'} size="icon" onClick={() => setDevice(type)}>
      <Icon className="h-5 w-5" />
    </Button>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-white">Önizleme</h1>
            {pages.length > 0 && (
              <select
                value={selectedPage?.id || ''}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="rounded-md border border-white/20 bg-slate-800 px-3 py-2 text-sm text-white"
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            <DeviceButton type="desktop" icon={Monitor} />
            <DeviceButton type="tablet" icon={Tablet} />
            <DeviceButton type="mobile" icon={Smartphone} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!selectedPage}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button>
              <ExternalLink className="h-4 w-4" />
              Yayınla
            </Button>
          </div>
        </div>
      </header>

      {loading && <div className="p-8 text-slate-300">Önizleme yükleniyor...</div>}

      {error && (
        <div className="m-8 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && !selectedPage && (
        <div className="m-8 rounded-lg border border-white/10 bg-white/5 p-6 text-slate-300">
          Önizlenecek sayfa yok. Önce içerik üretin.
        </div>
      )}

      {!loading && !error && selectedPage && (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-8">
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              width: device === 'desktop' ? '100%' : `${deviceWidths[device]}px`,
              maxWidth: deviceWidths[device],
            }}
          >
            <Card className="overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="mx-4 flex-1">
                  <div className="rounded-full bg-slate-700 px-4 py-1 text-center text-xs text-slate-400">preview.prosektorbuilder.com</div>
                </div>
              </div>

              <iframe
                key={key}
                srcDoc={previewHtml}
                className="w-full bg-white"
                style={{
                  height: device === 'mobile' ? '667px' : device === 'tablet' ? '800px' : '640px',
                  border: 'none',
                }}
                title="Site Preview"
              />
            </Card>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="capitalize">{device}</span>
          <span>•</span>
          <span>{deviceWidths[device]}px</span>
        </div>
      </div>
    </main>
  );
}
