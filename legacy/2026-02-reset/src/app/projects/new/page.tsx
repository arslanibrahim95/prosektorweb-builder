'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DEFAULT_OSGB_TEMPLATE, OSGB_INDUSTRY, OSGB_TEMPLATES } from '@/features/projects/lib/osgb';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState(DEFAULT_OSGB_TEMPLATE);
  const [industry] = useState(OSGB_INDUSTRY);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
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
          contact: {
            phone,
            email,
            city,
            district,
            address,
          },
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
              <CardDescription>OSGB siteniz için temel bilgileri girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Proje Adı</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Karin OSGB Düzce"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Açıklama (Opsiyonel)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: Düzce ve çevresinde iş sağlığı ve güvenliği hizmetleri"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Telefon (Opsiyonel)</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5xx xxx xx xx"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">E-posta (Opsiyonel)</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@osgb.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Şehir (Opsiyonel)</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Örn: Düzce"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">İlçe (Opsiyonel)</label>
                  <Input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Örn: Merkez"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Adres (Opsiyonel)</label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Adres"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OSGB Şablonu</CardTitle>
              <CardDescription>Başlangıç kurgusunu seçin (hepsi OSGB odaklı)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {OSGB_TEMPLATES.map((item) => (
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
              <CardDescription>Bu uygulama yalnızca OSGB siteleri üretir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {industry}
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
