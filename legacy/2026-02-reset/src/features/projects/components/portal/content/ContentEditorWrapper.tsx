'use client'

import { useState } from 'react'
import { ContentEditor } from '@/shared/components/ui'
import { FileText, Save, X, Edit2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { sanitizeHtml } from '@/shared/lib/sanitize'
import { logger } from '@/shared/lib/logger'

interface ContentEditorWrapperProps {
    contentId: string
    initialContent: string
    projectId: string
    status: string
}

export function ContentEditorWrapper({
    contentId,
    initialContent,
    projectId,
    status
}: ContentEditorWrapperProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [content, setContent] = useState(initialContent)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/portal/content/${contentId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })

            if (response.ok) {
                setIsEditing(false)
                router.refresh()
            }
        } catch (error) {
            console.error('Save error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setContent(initialContent)
        setIsEditing(false)
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-600" />
                    İçerik
                </h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" />
                        Düzenle
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Save className="w-3 h-3" />
                            )}
                            Kaydet
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6">
                {isEditing ? (
                    <ContentEditor
                        content={content}
                        onChange={setContent}
                        editable={true}
                    />
                ) : (
                    <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
                    </div>
                )}
            </div>
        </div>
    )
}
