'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Monitor, Tablet, Smartphone, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface ProjectDetail {
  slug: string;
  name: string;
}

interface ProjectPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  updatedAt: string;
}

interface PublishResponse {
  success: boolean;
  error?: string;
  pagesPublished?: number;
  qualityGate?: {
    qaScore: number;
    threshold: number;
    escalationLevel: 'none' | 'low' | 'medium' | 'high';
    forced: boolean;
  };
  webhook?: {
    ok: boolean;
    warning?: string;
  };
}

const deviceWidths: Record<DeviceType, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

export default function PreviewPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [device, setDevice] = useState<DeviceType>('desktop');
  const [key, setKey] = useState(0);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPages() {
      try {
        const [projectRes, pagesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/pages`),
        ]);

        const [projectJson, pagesJson] = await Promise.all([projectRes.json(), pagesRes.json()]);

        if (!projectRes.ok || !projectJson.success) {
          throw new Error(projectJson.error || 'Proje yüklenemedi');
        }

        if (!pagesRes.ok || !pagesJson.success) {
          throw new Error(pagesJson.error || 'Sayfalar yüklenemedi');
        }

        const loadedPages: ProjectPage[] = pagesJson.pages || [];

        if (!active) return;

        setProject(projectJson.project as ProjectDetail);
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

  const previewPath = useMemo(() => {
    if (!project?.slug) return null;
    const base = `/${project.slug}`;
    const pagePart = selectedPage?.slug ? `/${selectedPage.slug}` : '';
    return `${base}${pagePart || ''}`;
  }, [project?.slug, selectedPage?.slug]);

  const previewUrl = useMemo(() => {
    if (!previewPath) return null;
    // Cache-bust to force iframe refresh when user hits "Refresh".
    const sep = previewPath.includes('?') ? '&' : '?';
    return `${previewPath}${sep}_preview=${key}`;
  }, [previewPath, key]);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setPublishMessage(null);

      const response = await fetch(`/api/projects/${projectId}/publish`, { method: 'POST' });
      const result = (await response.json()) as PublishResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Yayinlama basarisiz');
      }

      const qualityNote = result.qualityGate
        ? `QA ${result.qualityGate.qaScore}/${result.qualityGate.threshold} (${result.qualityGate.escalationLevel}${result.qualityGate.forced ? ', force' : ''}).`
        : 'QA skoru raporlanmadi.';

      const webhookNote = result.webhook?.ok
        ? 'Demo cache yenilendi.'
        : result.webhook?.warning
          ? `Demo webhook uyarisi: ${result.webhook.warning}`
          : 'Demo webhook cevabi alinamadi.';

      setPublishMessage(`Yayinlama tamamlandi (${result.pagesPublished ?? 0} sayfa). ${qualityNote} ${webhookNote}`);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Yayinlama basarisiz');
    } finally {
      setPublishing(false);
    }
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
            <Button onClick={handlePublish} disabled={publishing}>
              <ExternalLink className="h-4 w-4" />
              {publishing ? 'Yayınlanıyor...' : 'Yayınla'}
            </Button>
          </div>
        </div>
      </header>

      {publishMessage && (
        <div className="mx-auto mt-4 max-w-5xl rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
          {publishMessage}
        </div>
      )}

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
                  <div className="rounded-full bg-slate-700 px-4 py-1 text-center text-xs text-slate-400">
                    {previewPath || '—'}
                  </div>
                </div>
              </div>

              <iframe
                key={key}
                src={previewUrl || undefined}
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
