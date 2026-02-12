import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Newspaper, Plus, Edit2, Eye, Archive, FileText } from 'lucide-react';

interface BlogPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { projectId } = await params;

  const project = await prisma.webProject.findUnique({
    where: { id: projectId },
    include: {
      blogPosts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const statusColors = {
    DRAFT: 'bg-neutral-100 text-neutral-600',
    PUBLISHED: 'bg-green-100 text-green-700',
    ARCHIVED: 'bg-yellow-100 text-yellow-700',
  };

  const statusLabels = {
    DRAFT: 'Taslak',
    PUBLISHED: 'Yayinda',
    ARCHIVED: 'Arsivlendi',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Newspaper className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Blog Yonetimi</h1>
            <p className="text-neutral-500">Blog yazilarinizi olusturun ve yonetin</p>
          </div>
        </div>
        <Link
          href={`/portal/${projectId}/blog/yeni`}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Yazi
        </Link>
      </div>

      {project.blogPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-neutral-200">
          <FileText className="w-16 h-16 text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-1">Henuz blog yazisi yok</h3>
          <p className="text-neutral-500 mb-4">Ilk blog yazinizi olusturarak baslayabilirsiniz</p>
          <Link
            href={`/portal/${projectId}/blog/yeni`}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Yazi Olustur
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Baslik</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Durum</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500">Tarih</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-neutral-500">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {project.blogPosts.map((post) => (
                <tr key={post.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[post.status]}`}>
                      {statusLabels[post.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('tr-TR')
                      : new Date(post.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/portal/${projectId}/blog/${post.id}`}
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Duzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      {post.status === 'PUBLISHED' && (
                        <Link
                          href={`/${project.slug}/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Goruntule"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
