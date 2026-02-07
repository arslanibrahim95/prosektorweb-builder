'use client';

import { use } from 'react';
import { DesignCustomizer } from '@/features/projects/components/portal/design/DesignCustomizer';
import { Palette } from 'lucide-react';

interface TasarimPageProps {
  params: Promise<{ projectId: string }>;
}

export default function TasarimPage({ params }: TasarimPageProps) {
  const { projectId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-50 rounded-xl">
          <Palette className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tasarim</h1>
          <p className="text-neutral-500">Sitenizin renklerini ve fontlarini ozellestirin</p>
        </div>
      </div>

      <DesignCustomizer projectId={projectId} />
    </div>
  );
}
