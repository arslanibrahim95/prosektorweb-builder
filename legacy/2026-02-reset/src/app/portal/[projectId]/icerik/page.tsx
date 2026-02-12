import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { FileText, CheckCircle, Clock, Edit3 } from 'lucide-react';
import Link from 'next/link';

interface IcerikPageProps {
  params: Promise<{ projectId: string }>;
}

const contentTypeLabels: Record<string, string> = {
  HOMEPAGE: 'Ana Sayfa',
  ABOUT: 'Hakkimizda',
  SERVICES: 'Hizmetler',
  CONTACT: 'Iletisim',
  FAQ: 'SSS',
};

export default async function IcerikPage({ params }: IcerikPageProps) {
  const { projectId } = await params;

  const project = await prisma.webProject.findUnique({
    where: { id: projectId },
    include: {
      generatedContents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-50 rounded-xl">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Icerik Yonetimi</h1>
          <p className="text-neutral-500">Sayfa iceriklerinizi duzenleyin ve onaylayin</p>
        </div>
      </div>

      {project.generatedContents.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Henuz icerik olusturulmamis
          </h2>
          <p className="text-neutral-500 mb-6">
            AI ile icerik olusturmak icin proje sayfasina gidin.
          </p>
          <Link
            href={`/projects/${projectId}/generate`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
          >
            Icerik Olustur
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {project.generatedContents.map((content) => (
            <div
              key={content.id}
              className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {contentTypeLabels[content.contentType] || content.contentType}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        content.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : content.status === 'REVIEW'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {content.status === 'APPROVED' ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Onaylandi
                        </>
                      ) : content.status === 'REVIEW' ? (
                        <>
                          <Clock className="w-3 h-3" /> Incelemede
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3 h-3" /> Taslak
                        </>
                      )}
                    </span>
                  </div>
                  {content.title && (
                    <p className="text-neutral-600 mb-2">{content.title}</p>
                  )}
                  <p className="text-sm text-neutral-400">
                    Son guncelleme: {new Date(content.updatedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <Link
                  href={`/portal/${projectId}/icerik/${content.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Duzenle
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
