import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MediaLibrary } from '@/features/projects/components/portal/media/MediaLibrary';
import { Image } from 'lucide-react';

interface MedyaPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function MedyaPage({ params }: MedyaPageProps) {
  const { projectId } = await params;

  const project = await prisma.webProject.findUnique({
    where: { id: projectId },
    select: { companyId: true },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 rounded-xl">
          <Image className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Medya Kutuphanesi</h1>
          <p className="text-neutral-500">Sitenizin gorsellerini yukleyin ve yonetin</p>
        </div>
      </div>

      <MediaLibrary companyId={project.companyId} />
    </div>
  );
}
