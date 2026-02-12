'use client'

import { useState } from 'react'
import { updateProjectStatus } from '@/features/projects/actions/projects'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { ProjectStatus } from '@prisma/client'

interface Props {
    projectId: string
    currentStatus: string
}

const statuses = [
    { value: 'DRAFT', label: 'Taslak', color: 'bg-neutral-100 text-neutral-600 border-neutral-300' },
    { value: 'DESIGNING', label: 'Tasarım', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { value: 'DEVELOPMENT', label: 'Geliştirme', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'REVIEW', label: 'Müşteri İncelemesi', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'APPROVED', label: 'Onaylandı', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'DEPLOYING', label: 'Deploy Ediliyor', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 'LIVE', label: 'Yayında', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'PAUSED', label: 'Durduruldu', color: 'bg-neutral-100 text-neutral-600 border-neutral-300' },
    { value: 'CANCELLED', label: 'İptal', color: 'bg-red-100 text-red-700 border-red-300' },
]

export function ProjectStatusManager({ projectId, currentStatus }: Props) {
    const [loading, setLoading] = useState<string | null>(null)
    const [status, setStatus] = useState(currentStatus)

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === status) return

        setLoading(newStatus)
        const result = await updateProjectStatus(projectId, newStatus as ProjectStatus)

        if (result.success) {
            setStatus(newStatus)
        }
        setLoading(null)
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Proje Durumu</h2>
            <div className="space-y-2">
                {statuses.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => handleStatusChange(s.value)}
                        disabled={loading !== null}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${status === s.value
                            ? `${s.color} border-current`
                            : 'bg-white border-neutral-200 hover:bg-neutral-50'
                            } ${loading !== null ? 'opacity-50' : ''}`}
                    >
                        <span className="font-medium">{s.label}</span>
                        {loading === s.value ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : status === s.value ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : null}
                    </button>
                ))}
            </div>
        </div>
    )
}
