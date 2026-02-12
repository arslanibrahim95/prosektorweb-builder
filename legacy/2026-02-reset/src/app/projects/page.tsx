'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getOsgbTemplateLabel, OSGB_INDUSTRY } from '@/features/projects/lib/osgb';

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  template: string | null;
  industry: string | null;
  status: string;
  updatedAt: string;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  PLANNING: 'Planlama',
  DESIGNING: 'Tasarım',
  DEVELOPMENT: 'Geliştirme',
  REVIEW: 'İnceleme',
  LIVE: 'Yayında',
  PUBLISHED: 'Yayında',
  CANCELLED: 'İptal',
};

function statusClass(status: string): string {
  if (status === 'LIVE' || status === 'PUBLISHED') return 'bg-green-500/20 text-green-300';
  if (status === 'DEVELOPMENT' || status === 'DESIGNING') return 'bg-blue-500/20 text-blue-300';
  if (status === 'REVIEW') return 'bg-yellow-500/20 text-yellow-300';
  if (status === 'CANCELLED') return 'bg-red-500/20 text-red-300';
  return 'bg-purple-500/20 text-purple-300';
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch('/api/projects');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Projeler yüklenemedi');
        }

        if (active) {
          setProjects(result.projects || []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Projeler yüklenemedi');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const empty = useMemo(() => !loading && !error && projects.length === 0, [loading, error, projects.length]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white">Projelerim</h1>
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-5 w-5" />
              Yeni Proje
            </Button>
          </Link>
        </div>

        {loading && <p className="text-slate-300">Projeler yükleniyor...</p>}

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {empty && (
          <div className="py-16 text-center">
            <p className="mb-4 text-lg text-slate-400">Henüz proje yok</p>
            <Link href="/projects/new">
              <Button>İlk Projeyi Oluştur</Button>
            </Link>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-purple-500/50">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description || 'Açıklama yok'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-500/20 px-2 py-1 text-xs text-slate-300">
                        {getOsgbTemplateLabel(project.template)}
                      </span>
                      <span className="rounded-full bg-slate-500/20 px-2 py-1 text-xs text-slate-300">
                        {OSGB_INDUSTRY}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs ${statusClass(project.status)}`}>
                        {statusLabels[project.status] || project.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
