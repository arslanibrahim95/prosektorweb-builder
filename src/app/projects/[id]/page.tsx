'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Sparkles, Eye, Upload, Settings, Globe, Calendar, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template: string | null;
  industry: string | null;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  domain: { id: string; name: string } | null;
}

interface ProjectPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  updatedAt: string;
}

const statusBadge = {
  DRAFT: { variant: 'warning' as const, label: 'Taslak' },
  PLANNING: { variant: 'default' as const, label: 'Planlama' },
  DESIGNING: { variant: 'default' as const, label: 'Tasarım' },
  DEVELOPMENT: { variant: 'default' as const, label: 'Geliştirme' },
  REVIEW: { variant: 'warning' as const, label: 'İncelemede' },
  LIVE: { variant: 'success' as const, label: 'Yayında' },
  CANCELLED: { variant: 'error' as const, label: 'İptal' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
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

        if (active) {
          setProject(projectJson.project);
          setPages(pagesJson.pages || []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Veriler yüklenemedi');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-slate-300">Proje yükleniyor...</main>;
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">
          {error || 'Proje bulunamadı'}
        </div>
      </main>
    );
  }

  const status = statusBadge[project.status as keyof typeof statusBadge] || statusBadge.DRAFT;
  const generatedPages = pages.filter((page) => page.content.trim().length > 0).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-sm text-slate-400">{project.description || 'Açıklama girilmemiş'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}/generate`}>
              <Button variant="outline">
                <Sparkles className="h-4 w-4" />
                AI Üret
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/preview`}>
              <Button variant="outline">
                <Eye className="h-4 w-4" />
                Önizle
              </Button>
            </Link>
            <Button>
              <Upload className="h-4 w-4" />
              Yayınla
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <Folder className="mr-2 h-4 w-4" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="pages">
              <FileText className="mr-2 h-4 w-4" />
              Sayfalar
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-purple-400" />
                    Sayfalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{pages.length}</p>
                  <p className="text-sm text-slate-400">{generatedPages} sayfada içerik var</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-blue-400" />
                    Domain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium text-white">{project.domain?.name || 'Atanmadı'}</p>
                  <p className="text-sm text-slate-400">{project.domain ? 'Bağlı' : 'Henüz domain bağlanmadı'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Son Güncelleme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium text-white">{new Date(project.updatedAt).toLocaleDateString('tr-TR')}</p>
                  <p className="text-sm text-slate-400">{new Date(project.updatedAt).toLocaleTimeString('tr-TR')}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Hızlı Aksiyonlar</CardTitle>
                <CardDescription>Proje üzerinde devam etmek için bir yol seçin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Link href={`/projects/${projectId}/generate`}>
                    <div className="cursor-pointer rounded-lg border border-white/10 p-4 transition-all hover:border-purple-500/50 hover:bg-purple-500/10">
                      <Sparkles className="mb-3 h-8 w-8 text-purple-400" />
                      <h3 className="font-medium text-white">AI İçerik Üret</h3>
                      <p className="text-sm text-slate-400">Temel sayfaları otomatik üret</p>
                    </div>
                  </Link>
                  <Link href={`/projects/${projectId}/editor`}>
                    <div className="cursor-pointer rounded-lg border border-white/10 p-4 transition-all hover:border-blue-500/50 hover:bg-blue-500/10">
                      <FileText className="mb-3 h-8 w-8 text-blue-400" />
                      <h3 className="font-medium text-white">İçerik Düzenle</h3>
                      <p className="text-sm text-slate-400">Sayfaları manuel güncelle</p>
                    </div>
                  </Link>
                  <Link href={`/projects/${projectId}/preview`}>
                    <div className="cursor-pointer rounded-lg border border-white/10 p-4 transition-all hover:border-green-500/50 hover:bg-green-500/10">
                      <Eye className="mb-3 h-8 w-8 text-green-400" />
                      <h3 className="font-medium text-white">Önizle</h3>
                      <p className="text-sm text-slate-400">Tasarımı canlı gör</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sayfa Listesi</CardTitle>
                  <Link href={`/projects/${projectId}/editor`}>
                    <Button size="sm">
                      <FileText className="h-4 w-4" />
                      Düzenleyiciye Git
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {pages.length === 0 ? (
                  <p className="text-slate-400">Henüz sayfa yok. Önce AI üretimi başlatın.</p>
                ) : (
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <Link
                        key={page.id}
                        href={`/projects/${projectId}/editor?page=${page.id}`}
                        className="flex items-center justify-between rounded-lg border border-white/10 p-4 transition-all hover:border-purple-500/50 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-white">{page.name}</p>
                            <p className="text-sm text-slate-500">/{page.slug}</p>
                          </div>
                        </div>
                        <Badge variant={page.content.trim().length > 0 ? 'success' : 'warning'}>
                          {page.content.trim().length > 0 ? 'Hazır' : 'Taslak'}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Proje Ayarları</CardTitle>
                <CardDescription>Temel proje metadatası</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-400">Proje Adı</label>
                    <p className="font-medium text-white">{project.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Slug</label>
                    <p className="font-medium text-white">{project.slug}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Şablon</label>
                    <p className="font-medium text-white">{project.template || 'standard'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Sektör</label>
                    <p className="font-medium text-white">{project.industry || 'OSGB'}</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <Button variant="outline" className="border-red-400/50 text-red-400 hover:bg-red-400/10">
                    Projeyi Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
