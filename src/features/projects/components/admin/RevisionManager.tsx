'use client'

import { useState } from 'react'
import { approveRevision, completeRevision, rejectRevision } from '@/features/projects/actions/package-ops'
import {
    CheckCircle2, XCircle, Clock, Loader2, AlertCircle,
    Play, MessageSquare
} from 'lucide-react'

interface Revision {
    id: string
    revisionNumber: number
    description: string
    affectedPages: any
    status: string
    adminNotes: string | null
    completedAt: string | null
    createdAt: string
}

interface Props {
    projectId: string
    revisions: Revision[]
    usedRevisions: number
    maxRevisions: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    REQUESTED: { label: 'Talep Edildi', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    IN_PROGRESS: { label: 'Devam Ediyor', color: 'bg-blue-100 text-blue-700', icon: Play },
    COMPLETED: { label: 'Tamamlandi', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    REJECTED: { label: 'Reddedildi', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export function RevisionManager({ projectId, revisions, usedRevisions, maxRevisions }: Props) {
    const [loading, setLoading] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

    const handleAction = async (action: 'approve' | 'complete' | 'reject', revisionId: string) => {
        setLoading(revisionId)
        setResult(null)

        let res
        if (action === 'approve') {
            res = await approveRevision(revisionId)
        } else if (action === 'complete') {
            res = await completeRevision(revisionId)
        } else {
            res = await rejectRevision(revisionId, rejectReason)
            setRejectingId(null)
            setRejectReason('')
        }

        setResult({
            success: res.success,
            message: res.success ? 'Islem basarili' : (res.error || 'Hata olustu'),
        })
        setLoading(null)
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-brand-600" />
                    Revizyon Yonetimi
                </h2>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm font-bold text-neutral-700">
                    {usedRevisions}/{maxRevisions} kullanildi
                </span>
            </div>

            {result && (
                <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {result.message}
                </div>
            )}

            {revisions.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-sm">
                    Henuz revizyon talebi yok
                </div>
            ) : (
                <div className="space-y-4">
                    {revisions.map(rev => {
                        const status = STATUS_CONFIG[rev.status] || STATUS_CONFIG.REQUESTED
                        const StatusIcon = status.icon
                        return (
                            <div key={rev.id} className="border border-neutral-200 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-bold text-neutral-600">
                                            #{rev.revisionNumber}
                                        </div>
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <div className="text-xs text-neutral-400 mt-1">
                                                {new Date(rev.createdAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-neutral-700 mb-3">{rev.description}</p>

                                {rev.affectedPages && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {(Array.isArray(rev.affectedPages) ? rev.affectedPages : []).map((page: string) => (
                                            <span key={page} className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600">{page}</span>
                                        ))}
                                    </div>
                                )}

                                {rev.adminNotes && (
                                    <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-600 mb-3">
                                        <span className="font-semibold">Admin Notu:</span> {rev.adminNotes}
                                    </div>
                                )}

                                {/* Actions */}
                                {rev.status === 'REQUESTED' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction('approve', rev.id)}
                                            disabled={loading === rev.id}
                                            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {loading === rev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                            Onayla
                                        </button>
                                        {rejectingId === rev.id ? (
                                            <div className="flex gap-2 flex-1">
                                                <input
                                                    type="text"
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    placeholder="Red sebebi"
                                                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                                                />
                                                <button
                                                    onClick={() => handleAction('reject', rev.id)}
                                                    disabled={!rejectReason || loading === rev.id}
                                                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                                >
                                                    Gonder
                                                </button>
                                                <button onClick={() => setRejectingId(null)} className="px-3 py-2 text-neutral-500 text-sm">
                                                    Iptal
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setRejectingId(rev.id)}
                                                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
                                            >
                                                Reddet
                                            </button>
                                        )}
                                    </div>
                                )}

                                {rev.status === 'IN_PROGRESS' && (
                                    <button
                                        onClick={() => handleAction('complete', rev.id)}
                                        disabled={loading === rev.id}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {loading === rev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                        Tamamlandi
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
