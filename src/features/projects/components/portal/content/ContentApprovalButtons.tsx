'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, MessageSquare } from 'lucide-react'

interface ContentApprovalButtonsProps {
    contentId: string
    projectId: string
}

export function ContentApprovalButtons({ contentId, projectId }: ContentApprovalButtonsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    const handleApprove = async () => {
        setLoading('approve')
        try {
            const response = await fetch(`/api/portal/content/${contentId}/approve`, {
                method: 'POST',
            })
            if (response.ok) {
                router.refresh()
            }
        } catch (error) {
            console.error('Approve error:', error)
        } finally {
            setLoading(null)
        }
    }

    const handleReject = async () => {
        setLoading('reject')
        try {
            const response = await fetch(`/api/portal/content/${contentId}/reject`, {
                method: 'POST',
            })
            if (response.ok) {
                // Destek talebi sayfasına yönlendir
                router.push(`/portal/tickets/new?subject=İçerik Düzeltme Talebi&projectId=${projectId}&contentId=${contentId}`)
            }
        } catch (error) {
            console.error('Reject error:', error)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleApprove}
                disabled={loading !== null}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
                {loading === 'approve' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Check className="w-5 h-5" />
                )}
                Onayla
            </button>
            <button
                onClick={handleReject}
                disabled={loading !== null}
                className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
            >
                {loading === 'reject' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <X className="w-5 h-5" />
                )}
                Reddet & Düzeltme İste
            </button>
        </div>
    )
}
