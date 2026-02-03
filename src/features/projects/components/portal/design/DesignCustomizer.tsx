'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle, RotateCcw } from 'lucide-react'
import { ColorPicker } from './ColorPicker'
import { FontSelector } from './FontSelector'
import { DesignPreview } from './DesignPreview'

const DEFAULT_DESIGN = {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#f59e0b',
    bgColor: '#ffffff',
    fontHeading: 'Inter',
    fontBody: 'Inter',
}

interface DesignCustomizerProps {
    projectId: string
}

export function DesignCustomizer({ projectId }: DesignCustomizerProps) {
    const [design, setDesign] = useState(DEFAULT_DESIGN)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/portal/projects/${projectId}/design`)
                const json = await res.json()
                if (json.success && json.data) {
                    setDesign({ ...DEFAULT_DESIGN, ...json.data })
                }
            } finally {
                setLoading(false)
            }
        })()
    }, [projectId])

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        try {
            const res = await fetch(`/api/portal/projects/${projectId}/design`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(design),
            })
            const json = await res.json()
            if (json.success) setSaved(true)
        } finally {
            setSaving(false)
        }
    }

    const update = (key: string, value: string) => {
        setDesign(prev => ({ ...prev, [key]: value }))
        setSaved(false)
    }

    if (loading) {
        return <div className="flex items-center justify-center py-16 text-neutral-400">Yükleniyor...</div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5">
                    <h3 className="font-bold text-neutral-900">Renkler</h3>
                    <ColorPicker label="Ana Renk" value={design.primaryColor} onChange={v => update('primaryColor', v)} />
                    <ColorPicker label="İkincil Renk" value={design.secondaryColor} onChange={v => update('secondaryColor', v)} />
                    <ColorPicker label="Vurgu Rengi" value={design.accentColor} onChange={v => update('accentColor', v)} />
                    <ColorPicker label="Arka Plan" value={design.bgColor} onChange={v => update('bgColor', v)} />
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5">
                    <h3 className="font-bold text-neutral-900">Yazı Tipleri</h3>
                    <FontSelector label="Başlık Fontu" value={design.fontHeading} onChange={v => update('fontHeading', v)} />
                    <FontSelector label="Gövde Fontu" value={design.fontBody} onChange={v => update('fontBody', v)} />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                        {saving ? 'Kaydediliyor...' : <><Save className="w-4 h-4" /> Kaydet</>}
                    </button>
                    <button
                        onClick={() => { setDesign(DEFAULT_DESIGN); setSaved(false) }}
                        className="flex items-center gap-2 px-4 py-2.5 text-neutral-600 hover:bg-neutral-100 rounded-xl"
                    >
                        <RotateCcw className="w-4 h-4" /> Sıfırla
                    </button>
                    {saved && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" /> Kaydedildi
                        </span>
                    )}
                </div>
            </div>

            <div className="lg:sticky lg:top-6 self-start">
                <DesignPreview {...design} />
            </div>
        </div>
    )
}
