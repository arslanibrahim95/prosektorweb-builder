'use client'

import { useState } from 'react'
import {
    addDomainToCloudflare,
    syncDnsToCloudflare,
    setupStandardDns,
    CloudflareActionResult
} from '@/features/projects/actions/cloudflare'
import { Cloud, Loader2, CheckCircle2, AlertCircle, Server, Zap, RefreshCw } from 'lucide-react'

interface CloudflareActionsProps {
    domainId: string
    domainName: string
    serverIp: string | null
    hasZone: boolean
}

export function CloudflareActions({ domainId, domainName, serverIp, hasZone }: CloudflareActionsProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [result, setResult] = useState<CloudflareActionResult | null>(null)

    const handleAction = async (action: 'addZone' | 'syncDns' | 'setupStandard') => {
        setLoading(action)
        setResult(null)

        let res: CloudflareActionResult
        switch (action) {
            case 'addZone':
                res = await addDomainToCloudflare(domainId)
                break
            case 'syncDns':
                res = await syncDnsToCloudflare(domainId)
                break
            case 'setupStandard':
                res = await setupStandardDns(domainId)
                break
        }

        setResult(res)
        setLoading(null)
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-orange-500" />
                Cloudflare Entegrasyonu
            </h2>

            {/* Result Message */}
            {result && (
                <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {result.success ? (
                        <CheckCircle2 className="w-5 h-5 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                    )}
                    <div>
                        {result.success ? (
                            <>
                                <p className="font-medium">{result.data?.message || 'İşlem başarılı!'}</p>
                                {result.data?.nameServers && (
                                    <div className="mt-2 p-3 bg-white rounded-lg border border-green-200">
                                        <p className="text-sm font-medium mb-1">Nameserver'ları domain sağlayıcınızda güncelleyin:</p>
                                        <ul className="text-sm font-mono">
                                            {result.data.nameServers.map((ns: string) => (
                                                <li key={ns}>{ns}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {result.data?.results && (
                                    <ul className="mt-2 text-sm space-y-1">
                                        {result.data.results.map((r: string, i: number) => (
                                            <li key={i}>{r}</li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        ) : (
                            <p>{result.error}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                {/* Quick Setup */}
                {serverIp && (
                    <button
                        onClick={() => handleAction('setupStandard')}
                        disabled={loading !== null}
                        className="w-full flex items-center justify-between p-4 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-brand-600" />
                            <div className="text-left">
                                <div className="font-medium text-brand-900">Hızlı Kurulum</div>
                                <div className="text-sm text-brand-600">Zone oluştur + A kayıtları ekle ({serverIp})</div>
                            </div>
                        </div>
                        {loading === 'setupStandard' && <Loader2 className="w-5 h-5 animate-spin text-brand-600" />}
                    </button>
                )}

                {/* Add Zone */}
                <button
                    onClick={() => handleAction('addZone')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <Cloud className="w-5 h-5 text-neutral-600" />
                        <div className="text-left">
                            <div className="font-medium text-neutral-900">Zone Ekle</div>
                            <div className="text-sm text-neutral-500">Cloudflare'a {domainName} zone'u ekle</div>
                        </div>
                    </div>
                    {loading === 'addZone' && <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />}
                </button>

                {/* Sync DNS */}
                <button
                    onClick={() => handleAction('syncDns')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-neutral-600" />
                        <div className="text-left">
                            <div className="font-medium text-neutral-900">DNS Senkronize Et</div>
                            <div className="text-sm text-neutral-500">Yerel kayıtları Cloudflare'a gönder</div>
                        </div>
                    </div>
                    {loading === 'syncDns' && <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />}
                </button>
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Not:</strong> Zone oluşturduktan sonra, domain sağlayıcınızda nameserver'ları Cloudflare'a yönlendirmeniz gerekiyor.
            </div>
        </div>
    )
}
