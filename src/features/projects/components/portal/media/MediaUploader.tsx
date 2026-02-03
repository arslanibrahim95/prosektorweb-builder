'use client'

import { useState, useRef } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024

interface MediaUploaderProps {
    category?: string
    companyId?: string
    onUploadComplete: (asset: any) => void
}

export function MediaUploader({ category = 'GENERAL', companyId, onUploadComplete }: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = async (file: File) => {
        setError(null)

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Desteklenmeyen dosya türü. Sadece JPEG, PNG, WebP ve SVG kabul edilir.')
            return
        }
        if (file.size > MAX_SIZE) {
            setError('Dosya boyutu 5MB\'ı aşamaz.')
            return
        }

        setUploading(true)
        setProgress(30)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', category)
            if (companyId) formData.append('companyId', companyId)

            setProgress(60)

            const res = await fetch('/api/portal/media/upload', {
                method: 'POST',
                body: formData,
            })

            setProgress(90)

            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Yükleme başarısız.')

            setProgress(100)
            onUploadComplete(json.data)
        } catch (err: any) {
            setError(err.message || 'Yükleme sırasında hata oluştu.')
        } finally {
            setUploading(false)
            setProgress(0)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-3">
            <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    uploading ? 'border-brand-300 bg-brand-50' : 'border-neutral-300 hover:border-brand-400 hover:bg-neutral-50'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(file)
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFile(file)
                    }}
                    disabled={uploading}
                />
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-48 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm text-neutral-500">Yükleniyor...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-500">
                        <Upload className="w-8 h-8" />
                        <span className="text-sm">Dosya sürükle veya tıkla</span>
                        <span className="text-xs text-neutral-400">JPEG, PNG, WebP, SVG - Maks 5MB</span>
                    </div>
                )}
            </label>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
