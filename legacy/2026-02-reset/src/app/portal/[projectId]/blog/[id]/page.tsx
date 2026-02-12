import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BlogEditor } from '@/features/projects/components/portal/blog/BlogEditor';
import { Edit2 } from 'lucide-react';

interface BlogEditPageProps {
  params: Promise<{ projectId: string; id: string }>;
}

export default async function BlogEditPage({ params }: BlogEditPageProps) {
  const { projectId, id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post || post.projectId !== projectId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <Edit2 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Yaziyi Duzenle</h1>
          <p className="text-neutral-500">{post.title}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <BlogEditor
          projectId={projectId}
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverImage: post.coverImage,
            status: post.status,
          }}
        />
      </div>
    </div>
  );
}
