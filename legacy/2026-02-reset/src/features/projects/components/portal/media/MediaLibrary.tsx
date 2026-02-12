'use client'

import { useState, useEffect } from 'react'
import { Trash2, Image as ImageIcon, Filter } from 'lucide-react'
import { MediaUploader } from './MediaUploader'

const CATEGORIES = [
    { value: '', label: 'Tümü' },
    { value: 'LOGO', label: 'Logo' },
    { value: 'GALLERY', label: 'Galeri' },
    { value: 'TEAM', label: 'Ekip' },
    { value: 'BLOG', label: 'Blog' },
    { value: 'GENERAL', label: 'Genel' },
]

interface MediaLibraryProps {
    companyId?: string
}

export function MediaLibrary({ companyId }: MediaLibraryProps = {}) {
    const [assets, setAssets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('')
    const [deleting, setDeleting] = useState<string | null>(null)

    const fetchAssets = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (category) params.set('category', category)
            if (companyId) params.set('companyId', companyId)
            const res = await fetch(`/api/portal/media?${params}`)
            const json = await res.json()
            if (json.success) setAssets(json.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAssets()
    }, [category])

    const handleDelete = async (id: string) => {
        if (!confirm('Bu medyayı silmek istediğinize emin misiniz?')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/portal/media/${id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                setAssets(prev => prev.filter(a => a.id !== id))
            }
        } finally {
            setDeleting(null)
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="space-y-6">
            <MediaUploader
                category={category || 'GENERAL'}
                companyId={companyId}
                onUploadComplete={(asset) => setAssets(prev => [asset, ...prev])}
            />

            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            category === cat.value
                                ? 'bg-brand-100 text-brand-700 font-medium'
                                : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-neutral-400">Yükleniyor...</div>
            ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                    <ImageIcon className="w-16 h-16 mb-3" />
                    <span className="text-lg">Henüz medya yüklenmemiş</span>
                    <span className="text-sm mt-1">Yukarıdan dosya yükleyebilirsiniz</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {assets.map(asset => (
                        <div key={asset.id} className="group relative bg-white border border-neutral-200 rounded-xl overflow-hidden">
                            <div className="aspect-square">
                                <img
                                    src={asset.url}
                                    alt={asset.alt || asset.originalName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-neutral-600 truncate">{asset.originalName}</p>
                                <p className="text-xs text-neutral-400">{formatSize(asset.size)}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(asset.id)}
                                disabled={deleting === asset.id}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
