'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Building2, Package, FileText, CheckCircle2,
    ChevronRight, ChevronLeft, Loader2, AlertCircle,
    Sparkles
} from 'lucide-react'
import { createSiteFromWizard, type SiteCreationInput } from '@/features/projects/actions/site-creation'
import { ADD_ON_FEATURES, PRICING_TIERS } from '@/features/ai-generation/lib/pipeline/quote-generator'

interface Props {
    companies: Array<{
        id: string
        name: string
        phone?: string | null
        email?: string | null
        address?: string | null
        naceCode?: string | null
    }>
}

type PackageTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'

const TIER_DISPLAY: Record<PackageTier, { label: string; price: string; pages: string; revisions: string; hosting: string; domain: string; color: string }> = {
    STARTER: { label: 'Starter', price: '7.500 TL', pages: '5', revisions: '1', hosting: '1 yil', domain: '-', color: 'border-blue-300 bg-blue-50' },
    PROFESSIONAL: { label: 'Professional', price: '15.000 TL', pages: '10', revisions: '2', hosting: '1 yil', domain: '1 yil dahil', color: 'border-brand-400 bg-brand-50' },
    ENTERPRISE: { label: 'Enterprise', price: '35.000 TL', pages: 'Sinirsiz', revisions: '3', hosting: '1 yil', domain: '1 yil dahil', color: 'border-purple-400 bg-purple-50' },
}

const STEPS = [
    { id: 1, label: 'Firma', icon: Building2 },
    { id: 2, label: 'Paket', icon: Package },
    { id: 3, label: 'Icerik', icon: FileText },
    { id: 4, label: 'Onay', icon: CheckCircle2 },
]

export function SiteCreationWizard({ companies }: Props) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Step 1 - Company
    const [companyId, setCompanyId] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [naceCode, setNaceCode] = useState('')
    const [isNewCompany, setIsNewCompany] = useState(false)

    // Step 2 - Package
    const [tier, setTier] = useState<PackageTier>('PROFESSIONAL')
    const [addOnFeatures, setAddOnFeatures] = useState<string[]>([])

    // Step 3 - Content
    const [services, setServices] = useState('')
    const [references, setReferences] = useState('')
    const [certifications, setCertifications] = useState('')
    const [workingHours, setWorkingHours] = useState('')
    const [colorPreference, setColorPreference] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [slogan, setSlogan] = useState('')

    const handleCompanySelect = (id: string) => {
        if (id === 'new') {
            setIsNewCompany(true)
            setCompanyId('')
            setCompanyName('')
            setPhone('')
            setEmail('')
            setAddress('')
            setNaceCode('')
        } else {
            setIsNewCompany(false)
            setCompanyId(id)
            const company = companies.find(c => c.id === id)
            if (company) {
                setCompanyName(company.name)
                setPhone(company.phone || '')
                setEmail(company.email || '')
                setAddress(company.address || '')
                setNaceCode(company.naceCode || '')
            }
        }
    }

    const toggleAddOn = (featureId: string) => {
        setAddOnFeatures(prev =>
            prev.includes(featureId)
                ? prev.filter(f => f !== featureId)
                : [...prev, featureId]
        )
    }

    const canProceed = () => {
        switch (step) {
            case 1: return companyName.length >= 2
            case 2: return !!tier
            case 3: return true
            case 4: return true
            default: return false
        }
    }

    const calculateTotal = () => {
        const tierConfig = PRICING_TIERS.find(t => t.id === tier.toLowerCase())
        let total = tierConfig?.basePrice || 0
        for (const fid of addOnFeatures) {
            const addon = ADD_ON_FEATURES.find(f => f.id === fid)
            if (addon) total += addon.price
        }
        return total
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        const input: SiteCreationInput = {
            company: {
                companyId: isNewCompany ? undefined : companyId || undefined,
                companyName,
                phone: phone || undefined,
                email: email || undefined,
                address: address || undefined,
                naceCode: naceCode || undefined,
            },
            package: {
                tier,
                addOnFeatures,
            },
            content: {
                services: services || undefined,
                references: references || undefined,
                certifications: certifications || undefined,
                workingHours: workingHours || undefined,
                colorPreference: colorPreference || undefined,
                logoUrl: logoUrl || undefined,
                slogan: slogan || undefined,
            },
        }

        const result = await createSiteFromWizard(input)
        if (result.success && result.data) {
            router.push(`/admin/projects/${result.data.projectId}`)
            router.refresh()
        } else {
            setError(result.error || 'Bir hata olustu')
        }
        setLoading(false)
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8">
                {STEPS.map((s, i) => {
                    const Icon = s.icon
                    const isActive = step === s.id
                    const isCompleted = step > s.id
                    return (
                        <div key={s.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-brand-600 text-white' : isActive ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-neutral-100 text-neutral-400'}`}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${isActive ? 'text-brand-600' : 'text-neutral-500'}`}>{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full ${isCompleted ? 'bg-brand-600' : 'bg-neutral-200'}`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Step 1: Company */}
            {step === 1 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
                    <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-brand-600" />
                        Firma Bilgileri
                    </h2>

                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Firma Sec</label>
                        <select
                            value={isNewCompany ? 'new' : companyId}
                            onChange={e => handleCompanySelect(e.target.value)}
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Mevcut firma secin...</option>
                            <option value="new">+ Yeni Firma Olustur</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {(isNewCompany || companyId) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Firma Adi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    placeholder="Firma adi"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Telefon</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="0212 xxx xx xx"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">E-posta</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="info@firma.com"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">NACE Kodu</label>
                                <input
                                    type="text"
                                    value={naceCode}
                                    onChange={e => setNaceCode(e.target.value)}
                                    placeholder="86.21"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Adres</label>
                                <textarea
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    rows={2}
                                    placeholder="Firma adresi"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Package */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
                            <Package className="w-5 h-5 text-brand-600" />
                            Paket Secimi
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(Object.keys(TIER_DISPLAY) as PackageTier[]).map(t => {
                                const info = TIER_DISPLAY[t]
                                const isSelected = tier === t
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setTier(t)}
                                        className={`p-6 rounded-2xl border-2 text-left transition-all ${isSelected ? `${info.color} border-brand-600 ring-2 ring-brand-200` : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}
                                    >
                                        <div className="text-lg font-bold text-neutral-900 mb-1">{info.label}</div>
                                        <div className="text-2xl font-black text-brand-600 mb-4">{info.price}</div>
                                        <div className="space-y-2 text-sm text-neutral-600">
                                            <div className="flex justify-between"><span>Sayfa</span><span className="font-semibold">{info.pages}</span></div>
                                            <div className="flex justify-between"><span>Revizyon</span><span className="font-semibold">{info.revisions}</span></div>
                                            <div className="flex justify-between"><span>Hosting</span><span className="font-semibold">{info.hosting}</span></div>
                                            <div className="flex justify-between"><span>Domain</span><span className="font-semibold">{info.domain}</span></div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Ek Ozellikler</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ADD_ON_FEATURES.map(feature => (
                                <label
                                    key={feature.id}
                                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${addOnFeatures.includes(feature.id) ? 'border-brand-400 bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={addOnFeatures.includes(feature.id)}
                                        onChange={() => toggleAddOn(feature.id)}
                                        className="w-4 h-4 text-brand-600 rounded border-neutral-300"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-neutral-900 text-sm">{feature.name}</div>
                                        <div className="text-xs text-neutral-500">{feature.description}</div>
                                    </div>
                                    <div className="text-sm font-bold text-neutral-700">
                                        {feature.price.toLocaleString('tr-TR')} TL
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Content Info */}
            {step === 3 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
                    <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        Icerik Bilgileri
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Hizmet Detaylari</label>
                            <textarea
                                value={services}
                                onChange={e => setServices(e.target.value)}
                                rows={3}
                                placeholder="OSGB olarak sunulan hizmetler (is guvenligi uzmanligi, isyeri hekimligi, egitimler, vb.)"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Referanslar</label>
                            <textarea
                                value={references}
                                onChange={e => setReferences(e.target.value)}
                                rows={2}
                                placeholder="Firma referanslari (calistigi firmalar, sektorler)"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Sertifikalar</label>
                            <textarea
                                value={certifications}
                                onChange={e => setCertifications(e.target.value)}
                                rows={2}
                                placeholder="ISO, TSE, TURKAK, vb."
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Calisma Saatleri</label>
                            <input
                                type="text"
                                value={workingHours}
                                onChange={e => setWorkingHours(e.target.value)}
                                placeholder="Pzt-Cum 09:00-18:00"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Renk Tercihi</label>
                            <input
                                type="text"
                                value={colorPreference}
                                onChange={e => setColorPreference(e.target.value)}
                                placeholder="Mavi/Yesil, #003366, vb."
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Logo URL</label>
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={e => setLogoUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Slogan</label>
                            <input
                                type="text"
                                value={slogan}
                                onChange={e => setSlogan(e.target.value)}
                                placeholder="Is guvenligi bizim isimiz"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
                            <CheckCircle2 className="w-5 h-5 text-brand-600" />
                            Ozet ve Onay
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-bold text-neutral-700 text-sm uppercase tracking-wider">Firma</h3>
                                <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
                                    <div><span className="text-neutral-500">Ad:</span> <span className="font-medium">{companyName}</span></div>
                                    {phone && <div><span className="text-neutral-500">Tel:</span> {phone}</div>}
                                    {email && <div><span className="text-neutral-500">E-posta:</span> {email}</div>}
                                    {address && <div><span className="text-neutral-500">Adres:</span> {address}</div>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-neutral-700 text-sm uppercase tracking-wider">Paket</h3>
                                <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
                                    <div><span className="text-neutral-500">Tier:</span> <span className="font-bold text-brand-600">{TIER_DISPLAY[tier].label}</span></div>
                                    <div><span className="text-neutral-500">Sayfa:</span> {TIER_DISPLAY[tier].pages}</div>
                                    <div><span className="text-neutral-500">Revizyon:</span> {TIER_DISPLAY[tier].revisions}</div>
                                    {addOnFeatures.length > 0 && (
                                        <div>
                                            <span className="text-neutral-500">Ek Ozellikler:</span>
                                            <ul className="mt-1 ml-4 list-disc text-neutral-700">
                                                {addOnFeatures.map(fid => {
                                                    const f = ADD_ON_FEATURES.find(a => a.id === fid)
                                                    return f ? <li key={fid}>{f.name}</li> : null
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <div className="text-sm text-brand-700 font-medium">Tahmini Toplam</div>
                            <div className="text-3xl font-black text-brand-700">
                                {calculateTotal().toLocaleString('tr-TR')} TL
                                <span className="text-sm font-normal text-brand-500 ml-2">+ KDV</span>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5" />
                            )}
                            Pipeline Baslat
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setStep(s => s - 1)}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 disabled:opacity-30 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Geri
                </button>
                {step < 4 && (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        disabled={!canProceed()}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                        Devam
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
