'use client'

import { useActionState, useState } from 'react'
import { updateProject, ActionResult } from '@/features/projects/actions/projects'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'

interface Props {
    project: {
        id: string
        siteUrl: string | null
        previewUrl: string | null
        repoUrl: string | null
        price: any
        isPaid: boolean
        notes: string | null
    }
}

const initialState: ActionResult = { success: false }

export function ProjectEditForm({ project }: Props) {
    const [saved, setSaved] = useState(false)

    const formAction = async (prevState: ActionResult, formData: FormData) => {
        const result = await updateProject(project.id, formData)
        if (result.success) {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        }
        return result
    }

    const [state, action, isPending] = useActionState(formAction, initialState)

    return (
        <form action={action} className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900">Proje Bilgileri</h2>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="text-green-600 flex items-center gap-1 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Kaydedildi!
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Kaydet
                    </button>
                </div>
            </div>

            {state.error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {state.error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Site URL (Canlı)
                    </label>
                    <input
                        type="url"
                        name="siteUrl"
                        defaultValue={project.siteUrl || ''}
                        placeholder="https://firma.com"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Önizleme URL
                    </label>
                    <input
                        type="url"
                        name="previewUrl"
                        defaultValue={project.previewUrl || ''}
                        placeholder="https://preview.prosektorweb.com/abc"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Git Repo
                    </label>
                    <input
                        type="url"
                        name="repoUrl"
                        defaultValue={project.repoUrl || ''}
                        placeholder="https://github.com/..."
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Fiyat (₺)
                    </label>
                    <input
                        type="number"
                        name="price"
                        step="0.01"
                        defaultValue={project.price?.toString() || ''}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isPaid"
                            defaultChecked={project.isPaid}
                            className="w-5 h-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="font-medium text-neutral-700">Ödeme alındı</span>
                    </label>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Notlar
                    </label>
                    <textarea
                        name="notes"
                        rows={4}
                        defaultValue={project.notes || ''}
                        placeholder="Proje hakkında notlar..."
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                </div>
            </div>
        </form>
    )
}
