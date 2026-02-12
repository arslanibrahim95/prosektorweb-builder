import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { SiteSettingsForm } from '@/features/projects/components/portal/settings/SiteSettingsForm';
import { Settings } from 'lucide-react';

interface AyarlarPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function AyarlarPage({ params }: AyarlarPageProps) {
  const { projectId } = await params;

  const project = await prisma.webProject.findUnique({
    where: { id: projectId },
    include: {
      siteSettings: true,
    },
  });

  if (!project) {
    notFound();
  }

  const initialData = {
    phone: project.siteSettings?.phone || '',
    email: project.siteSettings?.email || '',
    address: project.siteSettings?.address || '',
    workingHours: project.siteSettings?.workingHours || '',
    socialMedia: project.siteSettings?.socialMedia as {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      twitter?: string;
    } | undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-slate-100 rounded-xl">
          <Settings className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Site Ayarlari</h1>
          <p className="text-neutral-500">Iletisim bilgileri ve sosyal medya baglantilari</p>
        </div>
      </div>

      <SiteSettingsForm projectId={projectId} initialData={initialData} />
    </div>
  );
}
