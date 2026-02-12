'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProjectPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  updatedAt: string;
}

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const pageIdParam = searchParams.get('page');

  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId]);

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
          const initialPage = loadedPages.find((page) => page.id === pageIdParam) || loadedPages[0];
          setSelectedPageId(initialPage.id);
          setPageName(initialPage.name);
          setContent(initialPage.content);
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
  }, [pageIdParam, projectId]);

  const handlePageSelect = (pageId: string) => {
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;

    setSelectedPageId(page.id);
    setPageName(page.name);
    setContent(page.content);
  };

  const handleSave = async () => {
    if (!selectedPageId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${selectedPageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: pageName,
          content,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Kaydetme işlemi başarısız');
      }

      setPages((prev) => prev.map((page) => (page.id === selectedPageId ? result.page : page)));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kaydetme işlemi başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = async () => {
    const name = window.prompt('Yeni sayfa adı');

    if (!name || !name.trim()) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Sayfa oluşturulamadı');
      }

      const createdPage: ProjectPage = result.page;
      setPages((prev) => [...prev, createdPage]);
      handlePageSelect(createdPage.id);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Sayfa oluşturulamadı');
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-slate-300">Editör yükleniyor...</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex h-screen">
        <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-4">
          <div className="mb-6 flex items-center gap-2">
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="font-semibold text-white">Sayfalar</h2>
          </div>

          {error && <p className="mb-3 text-xs text-red-300">{error}</p>}

          <div className="space-y-1">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageSelect(page.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedPageId === page.id ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>{page.name}</span>
                <span className="block text-xs text-slate-500">/{page.slug}</span>
              </button>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={handleCreatePage}>
            <Plus className="h-4 w-4" />
            Yeni Sayfa
          </Button>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-4">
              <Input value={pageName} onChange={(e) => setPageName(e.target.value)} className="border-none bg-transparent text-lg font-semibold focus:ring-0" />
              <Badge variant="outline">/{selectedPage?.slug || '-'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/projects/${projectId}/preview`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                  Önizle
                </Button>
              </Link>
              <Button size="sm" onClick={handleSave} disabled={!selectedPageId || saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">İçerik Editörü (HTML)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="HTML içeriğinizi buraya yazın..."
                  disabled={!selectedPageId}
                />
              </CardContent>
            </Card>
          </div>

          <footer className="flex items-center justify-between border-t border-white/10 bg-slate-900/50 p-4">
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>Son düzenleme: {selectedPage ? new Date(selectedPage.updatedAt).toLocaleString('tr-TR') : '-'}</span>
              <span>•</span>
              <span>{content.length} karakter</span>
            </div>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
              <Trash2 className="h-4 w-4" />
              Sayfayı Sil
            </Button>
          </footer>
        </div>

        <aside className="w-96 overflow-auto border-l border-white/10 bg-slate-900/50 p-4">
          <h3 className="mb-4 font-semibold text-white">Canlı Önizleme</h3>
          <div className="rounded-lg bg-white p-4 text-sm text-slate-900">
            <div dangerouslySetInnerHTML={{ __html: content || '<p>Önizleme için içerik girin.</p>' }} />
          </div>
        </aside>
      </div>
    </main>
  );
}
