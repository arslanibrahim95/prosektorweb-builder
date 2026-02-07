'use client';

import { use } from 'react';
import { BlogEditor } from '@/features/projects/components/portal/blog/BlogEditor';
import { PenLine } from 'lucide-react';

interface YeniYaziPageProps {
  params: Promise<{ projectId: string }>;
}

export default function YeniYaziPage({ params }: YeniYaziPageProps) {
  const { projectId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <PenLine className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Yeni Blog Yazisi</h1>
          <p className="text-neutral-500">Yeni bir blog yazisi olusturun</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <BlogEditor projectId={projectId} />
      </div>
    </div>
  );
}
