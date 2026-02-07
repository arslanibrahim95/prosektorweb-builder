'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface GenerationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

const initialSteps: GenerationStep[] = [
  { id: 'analysis', name: 'Analiz', status: 'pending' },
  { id: 'research', name: 'Araştırma', status: 'pending' },
  { id: 'design', name: 'Tasarım', status: 'pending' },
  { id: 'content', name: 'İçerik Üretimi', status: 'pending' },
  { id: 'seo', name: 'SEO Optimizasyonu', status: 'pending' },
  { id: 'build', name: 'Sayfa Oluşturma', status: 'pending' },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function GeneratePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>(initialSteps);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = useMemo(() => companyName.trim().length > 1 && description.trim().length > 10, [companyName, description]);

  const handleGenerate = async () => {
    if (!isFormValid) return;

    setIsGenerating(true);
    setDone(false);
    setError(null);
    setSteps(initialSteps);

    try {
      for (let i = 0; i < initialSteps.length; i += 1) {
        setSteps((prev) =>
          prev.map((step, idx) => ({
            ...step,
            status: idx < i ? 'completed' : idx === i ? 'running' : 'pending',
          }))
        );
        await wait(450);
      }

      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          description,
          services,
          phone,
          email,
          address,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'İçerik üretimi başarısız');
      }

      setSteps((prev) => prev.map((step) => ({ ...step, status: 'completed' })));
      setDone(true);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'İçerik üretimi başarısız');
      setSteps((prev) => prev.map((step) => ({ ...step, status: step.status === 'running' ? 'error' : step.status })));
    } finally {
      setIsGenerating(false);
    }
  };

  const StepIcon = ({ status }: { status: GenerationStep['status'] }) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (status === 'running') return <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-400" />;
    return <Circle className="h-5 w-5 text-slate-600" />;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Sparkles className="h-6 w-6 text-purple-400" />
              AI İçerik Üretimi
            </h1>
            <p className="text-slate-400">Temel proje sayfalarını otomatik üretin</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">{error}</div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Firma Bilgileri</CardTitle>
                <CardDescription>AI içerik için temel metinleri girin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Firma Adı *</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Örn: ABC OSGB" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="description">Firma Tanımı *</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Firmanızı kısaca tanımlayın" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="services">Hizmetler</Label>
                  <Textarea id="services" value={services} onChange={(e) => setServices(e.target.value)} placeholder="Her satıra bir hizmet" className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İletişim Bilgileri</CardTitle>
                <CardDescription>Opsiyonel - İletişim sayfasında kullanılır</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0212 XXX XX XX" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@firma.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adres" className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Button size="lg" className="w-full" disabled={!isFormValid || isGenerating} onClick={handleGenerate}>
              {isGenerating ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Üretiliyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  İçerik Üret
                </>
              )}
            </Button>
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Üretim Süreci</CardTitle>
                <CardDescription>
                  {isGenerating
                    ? 'İçerik üretiliyor...'
                    : done
                    ? 'Üretim tamamlandı'
                    : 'Üretim başlamadı'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                        step.status === 'running'
                          ? 'border border-purple-500/50 bg-purple-500/20'
                          : step.status === 'completed'
                          ? 'bg-green-500/10'
                          : step.status === 'error'
                          ? 'bg-red-500/10'
                          : 'bg-white/5'
                      }`}
                    >
                      <StepIcon status={step.status} />
                      <div className="flex-1">
                        <p className={`font-medium ${step.status === 'completed' ? 'text-green-300' : step.status === 'running' ? 'text-purple-300' : 'text-slate-400'}`}>
                          {step.name}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">{index + 1}/{steps.length}</span>
                    </div>
                  ))}
                </div>

                {done && !isGenerating && (
                  <div className="mt-6 rounded-lg border border-green-500/50 bg-green-500/20 p-4">
                    <p className="flex items-center gap-2 font-medium text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      Sayfalar başarıyla üretildi
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/projects/${projectId}/editor`}>
                        <Button size="sm" variant="outline">Düzenle</Button>
                      </Link>
                      <Link href={`/projects/${projectId}/preview`}>
                        <Button size="sm">Önizle</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
