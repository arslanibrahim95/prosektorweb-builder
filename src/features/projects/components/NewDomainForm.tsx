'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Globe, Loader2, AlertCircle } from 'lucide-react'
import { createDomain } from '@/features/projects/actions/domains'

interface Company {
    id: string
    name: string
}

interface NewDomainPageProps {
    companies: Company[]
    defaultIp?: string
}

export function NewDomainForm({ companies, defaultIp }: NewDomainPageProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [domainName, setDomainName] = useState('')
    const [extension, setExtension] = useState('.com')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        formData.set('extension', extension)

        const result = await createDomain(formData)

        if (result.success) {
            router.push('/admin/domains')
            router.refresh()
        } else {
            setError(result.error || 'Bir hata oluştu')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-brand-600" />
                    Domain Bilgileri
                </h2>

                <div className="space-y-6">
                    {/* Domain Name */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Domain Adı <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                name="name"
                                required
                                value={domainName}
                                onChange={(e) => setDomainName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="firmaismi"
                                className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                            <select
                                value={extension}
                                onChange={(e) => setExtension(e.target.value)}
                                className="px-4 py-3 bg-neutral-100 border border-l-0 border-neutral-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                <option value=".com">.com</option>
                                <option value=".com.tr">.com.tr</option>
                                <option value=".net">.net</option>
                                <option value=".org">.org</option>
                            </select>
                        </div>
                        <p className="text-sm text-neutral-500 mt-2">
                            Tam domain: <strong>{domainName || 'firmaismi'}{extension}</strong>
                        </p>
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Bağlı Firma
                        </label>
                        <select
                            name="companyId"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Firma Seçin (Opsiyonel)</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Registrar */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Registrar
                        </label>
                        <input
                            type="text"
                            name="registrar"
                            placeholder="İsimtescil, GoDaddy, vb."
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Server IP */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Sunucu IP Adresi
                        </label>
                        <input
                            type="text"
                            name="serverIp"
                            placeholder="123.45.67.89"
                            defaultValue={defaultIp}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                        />
                        <p className="text-sm text-neutral-500 mt-1">
                            Domain'in yönlendirileceği sunucu IP adresi
                        </p>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Bitiş Tarihi
                        </label>
                        <input
                            type="date"
                            name="expiresAt"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Notlar
                        </label>
                        <textarea
                            name="notes"
                            rows={3}
                            placeholder="Opsiyonel notlar..."
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Link
                    href="/admin/domains"
                    className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
                >
                    İptal
                </Link>
                <button
                    type="submit"
                    disabled={loading || !domainName}
                    className="px-8 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Domain Ekle
                </button>
            </div>
        </form>
    )
}
