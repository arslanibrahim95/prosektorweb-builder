'use client'

import { useActionState, useState } from 'react'
import { createDnsRecord, deleteDnsRecord, ActionResult } from '@/features/projects/actions/domains'
import { Plus, Trash2, Loader2, Server, Globe, Mail, FileText, Zap } from 'lucide-react'

interface DnsRecord {
    id: string
    type: string
    name: string
    value: string
    ttl: number
    priority: number | null
}

interface DnsRecordsSectionProps {
    records: DnsRecord[]
    domainId: string
    serverIp: string
}

const recordTypeConfig: Record<string, { label: string, icon: any, color: string }> = {
    A: { label: 'A Record', icon: Server, color: 'bg-blue-100 text-blue-700' },
    AAAA: { label: 'AAAA', icon: Server, color: 'bg-indigo-100 text-indigo-700' },
    CNAME: { label: 'CNAME', icon: Globe, color: 'bg-green-100 text-green-700' },
    MX: { label: 'MX', icon: Mail, color: 'bg-purple-100 text-purple-700' },
    TXT: { label: 'TXT', icon: FileText, color: 'bg-orange-100 text-orange-700' },
    NS: { label: 'NS', icon: Globe, color: 'bg-cyan-100 text-cyan-700' },
    SRV: { label: 'SRV', icon: Zap, color: 'bg-pink-100 text-pink-700' },
}

const initialState: ActionResult = { success: false }

export function DnsRecordsSection({ records, domainId, serverIp }: DnsRecordsSectionProps) {
    const [showForm, setShowForm] = useState(false)
    const [recordType, setRecordType] = useState('A')

    const formAction = async (prevState: ActionResult, formData: FormData) => {
        const result = await createDnsRecord(formData)
        if (result.success) {
            setShowForm(false)
        }
        return result
    }

    const [state, action, isPending] = useActionState(formAction, initialState)

    const handleDelete = async (id: string) => {
        if (confirm('Bu DNS kaydını silmek istediğinizden emin misiniz?')) {
            await deleteDnsRecord(id, domainId)
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900">DNS Kayıtları</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Kayıt Ekle
                </button>
            </div>

            {/* Add Record Form */}
            {showForm && (
                <form action={action} className="mb-6 p-4 bg-neutral-50 rounded-xl space-y-4">
                    <input type="hidden" name="domainId" value={domainId} />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Tip</label>
                            <select
                                name="type"
                                value={recordType}
                                onChange={(e) => setRecordType(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                            >
                                <option value="A">A</option>
                                <option value="AAAA">AAAA</option>
                                <option value="CNAME">CNAME</option>
                                <option value="MX">MX</option>
                                <option value="TXT">TXT</option>
                                <option value="NS">NS</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Ad</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="@ veya subdomain"
                                defaultValue="@"
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Değer</label>
                            <input
                                type="text"
                                name="value"
                                required
                                placeholder={recordType === 'A' ? serverIp || '123.45.67.89' : 'değer'}
                                defaultValue={recordType === 'A' ? serverIp : ''}
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">TTL</label>
                            <select
                                name="ttl"
                                defaultValue="3600"
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                            >
                                <option value="300">5 dk</option>
                                <option value="3600">1 saat</option>
                                <option value="86400">1 gün</option>
                            </select>
                        </div>
                    </div>

                    {recordType === 'MX' && (
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Öncelik (MX)</label>
                            <input
                                type="number"
                                name="priority"
                                placeholder="10"
                                defaultValue="10"
                                className="w-32 px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                            />
                        </div>
                    )}

                    {state.error && (
                        <p className="text-sm text-red-600">{state.error}</p>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Ekle
                        </button>
                    </div>
                </form>
            )}

            {/* Records List */}
            {records.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                    <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Henüz DNS kaydı yok.</p>
                    <p className="text-sm">Yukarıdaki "Kayıt Ekle" butonuyla başlayın.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-200">
                                <th className="text-left py-3 text-xs font-bold text-neutral-500 uppercase">Tip</th>
                                <th className="text-left py-3 text-xs font-bold text-neutral-500 uppercase">Ad</th>
                                <th className="text-left py-3 text-xs font-bold text-neutral-500 uppercase">Değer</th>
                                <th className="text-left py-3 text-xs font-bold text-neutral-500 uppercase">TTL</th>
                                <th className="text-right py-3 text-xs font-bold text-neutral-500 uppercase">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {records.map((record) => {
                                const config = recordTypeConfig[record.type] || recordTypeConfig.A
                                const Icon = config.icon
                                return (
                                    <tr key={record.id} className="hover:bg-neutral-50">
                                        <td className="py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${config.color}`}>
                                                <Icon className="w-3 h-3" />
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="py-3 font-medium">{record.name}</td>
                                        <td className="py-3 font-mono text-sm text-neutral-600 max-w-xs truncate">
                                            {record.value}
                                            {record.priority && <span className="ml-2 text-neutral-400">(MX: {record.priority})</span>}
                                        </td>
                                        <td className="py-3 text-sm text-neutral-500">{record.ttl}s</td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
