'use client'

import { useActionState, useState } from 'react'
import { saveApiConfig, ActionResult } from '@/features/projects/actions/domains'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface ApiConfig {
    id: string
    name: string
    provider: string
    apiKey: string | null
    apiSecret: string | null
    apiEndpoint: string | null
    defaultIp: string | null
}

interface ApiConfigFormProps {
    provider: string
    name: string
    existing?: ApiConfig
    showServerOnly?: boolean
}

const initialState: ActionResult = { success: false }

export function ApiConfigForm({ provider, name, existing, showServerOnly }: ApiConfigFormProps) {
    const [saved, setSaved] = useState(false)

    const formAction = async (prevState: ActionResult, formData: FormData) => {
        const result = await saveApiConfig(formData)
        if (result.success) {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        return result
    }

    const [state, action, isPending] = useActionState(formAction, initialState)

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="provider" value={provider} />
            <input type="hidden" name="name" value={name} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Server IP - Always show for DEFAULT_SERVER, show for all if not serverOnly */}
                <div className={showServerOnly ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Varsayılan Sunucu IP
                    </label>
                    <input
                        type="text"
                        name="defaultIp"
                        defaultValue={existing?.defaultIp || ''}
                        placeholder="123.45.67.89"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                        Domain eklerken varsayılan olarak kullanılacak IP
                    </p>
                </div>

                {!showServerOnly && (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                API Key
                            </label>
                            <input
                                type="password"
                                name="apiKey"
                                defaultValue={existing?.apiKey || ''}
                                placeholder="API anahtarı"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                API Secret
                            </label>
                            <input
                                type="password"
                                name="apiSecret"
                                defaultValue={existing?.apiSecret || ''}
                                placeholder="API gizli anahtarı"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                API Endpoint
                            </label>
                            <input
                                type="url"
                                name="apiEndpoint"
                                defaultValue={existing?.apiEndpoint || ''}
                                placeholder="https://api.example.com/v1"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </>
                )}
            </div>

            {state.error && (
                <p className="text-sm text-red-600">{state.error}</p>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Kaydet
                </button>
                {saved && (
                    <span className="text-green-600 flex items-center gap-1 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Kaydedildi!
                    </span>
                )}
            </div>
        </form>
    )
}
