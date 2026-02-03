'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface SiteSettingsFormProps {
    projectId: string
    initialData: {
        phone?: string
        email?: string
        address?: string
        workingHours?: string
        socialMedia?: {
            facebook?: string
            instagram?: string
            linkedin?: string
            twitter?: string
        }
    }
}

export function SiteSettingsForm({ projectId, initialData }: SiteSettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [formData, setFormData] = useState({
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        workingHours: initialData.workingHours || 'Pazartesi - Cuma: 09:00 - 18:00',
        facebook: initialData.socialMedia?.facebook || '',
        instagram: initialData.socialMedia?.instagram || '',
        linkedin: initialData.socialMedia?.linkedin || '',
        twitter: initialData.socialMedia?.twitter || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSaved(false)

        try {
            const response = await fetch(`/api/portal/projects/${projectId}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        } catch (error) {
            console.error('Settings save error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* İletişim Bilgileri */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">İletişim Bilgileri</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="0212 123 4567"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            E-posta
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="info@firmaniz.com"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Adres
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="Tam adresinizi yazın"
                            rows={2}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Çalışma Saatleri
                        </label>
                        <input
                            type="text"
                            value={formData.workingHours}
                            onChange={(e) => handleChange('workingHours', e.target.value)}
                            placeholder="Pazartesi - Cuma: 09:00 - 18:00"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>
            </div>

            {/* Sosyal Medya */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">Sosyal Medya (Opsiyonel)</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Facebook
                        </label>
                        <input
                            type="url"
                            value={formData.facebook}
                            onChange={(e) => handleChange('facebook', e.target.value)}
                            placeholder="https://facebook.com/firmaniz"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Instagram
                        </label>
                        <input
                            type="url"
                            value={formData.instagram}
                            onChange={(e) => handleChange('instagram', e.target.value)}
                            placeholder="https://instagram.com/firmaniz"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            LinkedIn
                        </label>
                        <input
                            type="url"
                            value={formData.linkedin}
                            onChange={(e) => handleChange('linkedin', e.target.value)}
                            placeholder="https://linkedin.com/company/firmaniz"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Twitter / X
                        </label>
                        <input
                            type="url"
                            value={formData.twitter}
                            onChange={(e) => handleChange('twitter', e.target.value)}
                            placeholder="https://twitter.com/firmaniz"
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                    Değişiklikler kaydedildiğinde sitenize yansıyacaktır.
                </p>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {saved ? 'Kaydedildi!' : 'Kaydet'}
                </button>
            </div>
        </form>
    )
}
