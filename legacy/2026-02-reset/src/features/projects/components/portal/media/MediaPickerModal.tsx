'use client'

import { useState, useEffect } from 'react'
import { X, Check, Image as ImageIcon } from 'lucide-react'
import { MediaUploader } from './MediaUploader'

interface MediaPickerModalProps {
    open: boolean
    onClose: () => void
    onSelect: (asset: { id: string; url: string; alt: string | null }) => void
    category?: string
    companyId?: string
}

export function MediaPickerModal({ open, onClose, onSelect, category, companyId }: MediaPickerModalProps) {
    const [assets, setAssets] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)

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
        if (open) {
            fetchAssets()
            setSelected(null)
        }
    }, [open])

    if (!open) return null

    const selectedAsset = assets.find(a => a.id === selected)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                    <h2 className="text-lg font-bold text-neutral-900">Medya Seç</h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-neutral-100">
                    <MediaUploader
                        category={category || 'GENERAL'}
                        companyId={companyId}
                        onUploadComplete={(asset) => {
                            setAssets(prev => [asset, ...prev])
                            setSelected(asset.id)
                        }}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-neutral-400">Yükleniyor...</div>
                    ) : assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <span>Henüz medya yok</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            {assets.map(asset => (
                                <button
                                    key={asset.id}
                                    onClick={() => setSelected(asset.id)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                        selected === asset.id
                                            ? 'border-brand-500 ring-2 ring-brand-200'
                                            : 'border-transparent hover:border-neutral-300'
                                    }`}
                                >
                                    <img
                                        src={asset.url}
                                        alt={asset.alt || asset.originalName}
                                        className="w-full h-full object-cover"
                                    />
                                    {selected === asset.id && (
                                        <div className="absolute top-1 right-1 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
                    <button onClick={onClose} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl">
                        İptal
                    </button>
                    <button
                        onClick={() => {
                            if (selectedAsset) {
                                onSelect({ id: selectedAsset.id, url: selectedAsset.url, alt: selectedAsset.alt })
                                onClose()
                            }
                        }}
                        disabled={!selected}
                        className="px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Seç
                    </button>
                </div>
            </div>
        </div>
    )
}
