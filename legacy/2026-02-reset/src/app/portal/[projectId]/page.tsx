import { prisma } from '@/lib/prisma';
import { getDataInstance } from '@/lib/bodyData';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Palette,
  FileText,
  Image,
  Newspaper,
  ArrowRight,
  Eye,
  MessageSquare,
  Sparkles,
  BarChart3,
} from 'lucide-react';

interface DashboardPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { projectId } = await params;
  const bodyData = await getDataInstance();

  const project = await prisma.webProject.findUnique({
    where: { id: projectId },
    include: {
      company: true,
      siteSettings: true,
      generatedContents: true,
      blogPosts: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Fetch Site Stats
  const { totalDocs: messageCount } = await bodyData.find({
    collection: 'contact-submissions',
    where: {
      'project.id': { equals: projectId },
    },
    limit: 0,
  });

  const { totalDocs: quoteCount } = await bodyData.find({
    collection: 'quote-requests',
    where: {
      'project.id': { equals: projectId },
    },
    limit: 0,
  });

  const { docs: recentMessages } = await bodyData.find({
    collection: 'contact-submissions',
    where: {
      'project.id': { equals: projectId },
    },
    sort: '-createdAt',
    limit: 5,
  });

  const mediaCount = await prisma.siteMedia.count({
    where: { companyId: project.companyId },
  });

  const publishedBlogCount = await prisma.blogPost.count({
    where: { projectId, status: 'PUBLISHED' },
  });

  const quickActions = [
    {
      href: `/portal/${projectId}/icerik`,
      icon: Sparkles,
      label: 'İçerik Üret',
      description: 'AI ile sayfa içerikleri oluştur',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      href: `/portal/${projectId}/blog`,
      icon: Newspaper,
      label: 'Blog Yazısı',
      description: 'Yeni makale veya haber yayınla',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      href: `/portal/${projectId}/medya`,
      icon: Image,
      label: 'Medya',
      description: 'Görsel kütüphanesini yönet',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      href: `/portal/${projectId}/tasarim`,
      icon: Palette,
      label: 'Görünüm',
      description: 'Renk ve tema ayarları',
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Status */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <div className="flex-1 bg-neutral-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Merhaba, {project.name}</h1>
            <p className="text-neutral-400 mb-6 max-w-md">
              Siteniz şu anda {project.status === 'LIVE' ? 'yayında' : 'hazırlık aşamasında'}. 
              Tüm içerik ve tasarım ayarlarını buradan yönetebilirsiniz.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={`/${project.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all"
              >
                <Eye className="w-4 h-4" />
                Sitemi Gör
              </Link>
            </div>
          </div>
          <Sparkles className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 rotate-12" />
        </div>

        <div className="md:w-72 bg-white border border-neutral-200 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-500">Tamamlanma Oranı</span>
              <span className="text-sm font-bold text-brand-600">{project.progress}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-bold mb-3">Hızlı Durum</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Aktif Sayfalar</span>
                <span className="font-bold">{project.generatedContents.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Blog Yazıları</span>
                <span className="font-bold">{publishedBlogCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Gelen Mesajlar', value: messageCount + quoteCount, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Medya Dosyaları', value: mediaCount, icon: Image, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Blog Yazıları', value: publishedBlogCount, icon: Newspaper, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Ziyaretler', value: '0', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${stat.bg} ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-neutral-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Son Gelen Mesajlar</h2>
            <Link href={`/portal/${projectId}/mesajlar`} className="text-sm text-brand-600 font-bold hover:underline">
              Tümünü Gör
            </Link>
          </div>
          
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
            {recentMessages.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {recentMessages.map((msg: any) => (
                  <div key={msg.id} className="p-5 hover:bg-neutral-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-neutral-400">
                        {msg.name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900">{msg.name}</h3>
                        <p className="text-sm text-neutral-500 line-clamp-1">{msg.subject || msg.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-400 font-medium">
                        {new Date(msg.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${
                        msg.status === 'unread' ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {msg.status === 'unread' ? 'Yeni' : msg.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-neutral-200" />
                </div>
                <p className="text-neutral-500 font-medium">Henüz bir mesaj almadınız.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Recent Blog */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-900">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-2xl hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <div className={`p-3 rounded-xl ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900 text-sm">{action.label}</h3>
                  <p className="text-xs text-neutral-500">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-brand-600 transition-colors" />
              </Link>
            ))}
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 text-white shadow-lg">
            <h3 className="font-bold mb-2">Yardıma mı ihtiyacınız var?</h3>
            <p className="text-brand-100 text-sm mb-4">
              Sitenizi nasıl daha etkili kullanacağınızı öğrenmek için dökümantasyonu inceleyin.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors backdrop-blur-sm">
              Rehberi Görüntüle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
