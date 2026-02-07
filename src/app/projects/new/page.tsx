'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const templates = [
  { id: 'corporate', name: 'Kurumsal', description: 'Profesyonel şirket siteleri için' },
  { id: 'portfolio', name: 'Portfolyo', description: 'Kişisel çalışma vitrini' },
  { id: 'ecommerce', name: 'E-Ticaret', description: 'Online mağaza' },
  { id: 'blog', name: 'Blog', description: 'İçerik odaklı siteler' },
  { id: 'landing', name: 'Landing Page', description: 'Tek sayfa tanıtım' },
];

const industries = [
  'technology',
  'healthcare',
  'finance',
  'education',
  'retail',
  'restaurant',
  'real-estate',
  'legal',
  'marketing',
  'other',
];

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('corporate');
  const [industry, setIndustry] = useState('other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          template,
          industry,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Proje oluşturulamadı');
      }

      router.push(`/projects/${result.project.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Proje oluşturulamadı');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Yeni Proje</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">{error}</div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Proje Bilgileri</CardTitle>
              <CardDescription>Projeniz için temel bilgileri girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Proje Adı</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Şirket Web Sitesi"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Açıklama (Opsiyonel)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kısa bir açıklama..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Şablon Seçimi</CardTitle>
              <CardDescription>Projeniz için bir başlangıç şablonu seçin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      template === item.id ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sektör</CardTitle>
              <CardDescription>AI içerik üretimi için sektörünüzü seçin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {industries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setIndustry(item)}
                    className={`rounded-full px-4 py-2 text-sm transition-all ${
                      industry === item ? 'bg-purple-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={!name || !template || !industry || loading}>
            {loading ? (
              'Oluşturuluyor...'
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Projeyi Oluştur
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
