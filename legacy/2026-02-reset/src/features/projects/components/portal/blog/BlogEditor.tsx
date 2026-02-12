'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';

interface BlogEditorProps {
  projectId: string;
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    status: string;
  };
}

export function BlogEditor({ projectId, post }: BlogEditorProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    coverImage: post?.coverImage || '',
    status: post?.status || 'DRAFT',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/portal/blog/${post.id}`
        : '/api/portal/blog';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...formData,
        }),
      });

      const json = await response.json();

      if (json.success) {
        router.push(`/portal/${projectId}/blog`);
        router.refresh();
      } else {
        alert('Bir hata olustu: ' + (json.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Blog save error:', error);
      alert('Bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm('Bu yaziyi silmek istediginize emin misiniz?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/portal/blog/${post.id}`, {
        method: 'DELETE',
      });

      const json = await response.json();

      if (json.success) {
        router.push(`/portal/${projectId}/blog`);
        router.refresh();
      }
    } catch (error) {
      console.error('Blog delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Status Row */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Baslik
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Yazi basligi"
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Durum
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="DRAFT">Taslak</option>
            <option value="PUBLISHED">Yayinla</option>
            <option value="ARCHIVED">Arsivle</option>
          </select>
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Ozet (Opsiyonel)
        </label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => handleChange('excerpt', e.target.value)}
          placeholder="Kisa ozet (liste gorunumunde gosterilir)"
          rows={2}
          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Kapak Gorseli URL (Opsiyonel)
        </label>
        <input
          type="url"
          value={formData.coverImage}
          onChange={(e) => handleChange('coverImage', e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Icerik
        </label>
        <textarea
          required
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Yazi icerigini buraya yazin... (HTML desteklenir)"
          rows={15}
          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
        />
        <p className="text-xs text-neutral-500 mt-1">
          HTML etiketleri kullanabilirsiniz: &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;strong&gt;, &lt;em&gt;
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            Sil
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Iptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </form>
  );
}
