'use client'

import { useState } from 'react'
import { requestRevision } from '@/features/projects/actions/package-ops'
import { Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const PAGE_OPTIONS = ['Ana Sayfa', 'Hakkimizda', 'Hizmetler', 'Iletisim', 'SSS', 'Blog']

export function RevisionRequestForm({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false)
    const [description, setDescription] = useState('')
    const [pages, setPages] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    const togglePage = (page: string) => {
        setPages(prev => prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page])
    }

    const handleSubmit = async () => {
        if (!description.trim()) return
        setLoading(true)
        setResult(null)

        const res = await requestRevision(projectId, description, pages)
        setResult({
            success: res.success,
            message: res.success ? 'Revizyon talebiniz iletildi' : (res.error || 'Hata olustu'),
        })

        if (res.success) {
            setDescription('')
            setPages([])
            setOpen(false)
        }
        setLoading(false)
    }

    return (
        <div>
            {result && (
                <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {result.message}
                </div>
            )}

            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Revizyon Talebi
                </button>
            ) : (
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-neutral-900">Revizyon Talebi</h3>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Aciklama <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Degisiklik istediginiz konulari detayli olarak yazin..."
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Etkilenen Sayfalar
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PAGE_OPTIONS.map(page => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => togglePage(page)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pages.includes(page) ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!description.trim() || loading}
                            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Gonder
                        </button>
                        <button
                            onClick={() => { setOpen(false); setDescription(''); setPages([]) }}
                            className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200"
                        >
                            Iptal
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
