'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, Globe, Building2, DollarSign } from 'lucide-react'
import { createProject, ActionResult } from '@/features/projects/actions/projects'

interface Props {
    companies: Array<{ id: string; name: string }>
    domains: Array<{ id: string; name: string }>
}

export function NewProjectForm({ companies, domains }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const result = await createProject(formData)

        if (result.success) {
            router.push(`/admin/projects/${(result.data as any).id}`)
            router.refresh()
        } else {
            setError(result.error || 'Bir hata oluştu')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-brand-600" />
                    Proje Bilgileri
                </h2>

                <div className="space-y-6">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Proje Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="Örn: ABC Firma Web Sitesi"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Firma <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="companyId"
                            required
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Firma Seçin</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                        {companies.length === 0 && (
                            <p className="text-sm text-neutral-500 mt-2">
                                Henüz firma yok. <Link href="/admin/companies/new" className="text-brand-600 hover:underline">Yeni firma ekle</Link>
                            </p>
                        )}
                    </div>

                    {/* Domain */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Domain (Opsiyonel)
                        </label>
                        <select
                            name="domainId"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Domain Seçin (Sonra da atanabilir)</option>
                            {domains.map((domain) => (
                                <option key={domain.id} value={domain.id}>
                                    {domain.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Fiyat (₺)
                        </label>
                        <div className="relative">
                            <DollarSign className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="number"
                                name="price"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Notlar
                        </label>
                        <textarea
                            name="notes"
                            rows={3}
                            placeholder="Proje hakkında notlar..."
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Link
                    href="/admin/projects"
                    className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
                >
                    İptal
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Proje Oluştur
                </button>
            </div>
        </form>
    )
}
