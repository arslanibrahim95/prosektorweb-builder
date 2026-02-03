'use client'

import { useState } from 'react'
import { createPreview, setupDomainEmail, triggerDeploy, OpsResult } from '@/features/projects/actions/project-ops'
import {
    Loader2,
    Globe,
    Mail,
    Rocket,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'

interface Props {
    project: {
        id: string
        name: string
        domain?: { name: string } | null
        previewUrl?: string | null
        status: string
    }
}

export function ProjectOperations({ project }: Props) {
    const [loading, setLoading] = useState<string | null>(null)
    const [result, setResult] = useState<OpsResult | null>(null)
    const [previewSubdomain, setPreviewSubdomain] = useState('')
    const [forwardEmail, setForwardEmail] = useState('')

    const handlePreview = async () => {
        if (!previewSubdomain) return
        setLoading('preview')
        setResult(null)

        const res = await createPreview(project.id, previewSubdomain)
        setResult(res)
        setLoading(null)
    }

    const handleEmail = async () => {
        if (!forwardEmail) return
        setLoading('email')
        setResult(null)

        const res = await setupDomainEmail(project.id, forwardEmail)
        setResult(res)
        setLoading(null)
    }

    const handleDeploy = async () => {
        if (!confirm('Deploy işlemini başlatmak istediğinize emin misiniz?')) return
        setLoading('deploy')
        setResult(null)

        const res = await triggerDeploy(project.id)
        setResult(res)
        setLoading(null)
    }

    return (
        <div className="space-y-6">
            {result && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {result.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {result.message || result.error}
                </div>
            )}

            {/* Preview System */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    Demo / Önizleme
                </h2>
                {project.previewUrl ? (
                    <div className="bg-purple-50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="text-sm text-purple-700 font-semibold mb-1">Aktif Önizleme</div>
                            <a href={project.previewUrl} target="_blank" className="text-purple-600 hover:underline">{project.previewUrl}</a>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="subdomain (örn: musteri1)"
                                value={previewSubdomain}
                                onChange={e => setPreviewSubdomain(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                                .prosektorweb.com
                            </div>
                        </div>
                        <button
                            onClick={handlePreview}
                            disabled={loading === 'preview' || !previewSubdomain}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading === 'preview' && <Loader2 className="w-4 h-4 animate-spin" />}
                            Oluştur
                        </button>
                    </div>
                )}
            </div>

            {/* Email Setup */}
            {project.domain && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        E-posta Kurulumu
                    </h2>
                    <p className="text-sm text-neutral-500 mb-4">
                        Domain için info, iletisim, contact adreslerini oluştur ve yönlendir.
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="email"
                            placeholder="Yönlendirilecek Adres (örn: gmail)"
                            value={forwardEmail}
                            onChange={e => setForwardEmail(e.target.value)}
                            className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl"
                        />
                        <button
                            onClick={handleEmail}
                            disabled={loading === 'email' || !forwardEmail}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                            Kur
                        </button>
                    </div>
                </div>
            )}

            {/* Deploy System */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-orange-600" />
                    Deploy Sistemi
                </h2>
                <div className="bg-orange-50 p-4 rounded-xl mb-4 text-orange-800 text-sm">
                    Site dosyaları sunucuya kopyalanacak ve Nginx konfigürasyonu yapılacak.
                </div>
                <button
                    onClick={handleDeploy}
                    disabled={loading === 'deploy'}
                    className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading === 'deploy' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Rocket className="w-5 h-5" />
                    )}
                    Canlıya Al (Deploy)
                </button>
            </div>
        </div>
    )
}
