'use client'

import { useState } from 'react'
import { searchDomainsWithPricing, purchaseDomain, DomainSearchResult } from '@/features/projects/actions/domain-registrar'
import {
    Search,
    Globe,
    CheckCircle2,
    XCircle,
    Loader2,
    ShoppingCart,
    AlertCircle,
    Star,
    Zap
} from 'lucide-react'

interface Company {
    id: string
    name: string
}

interface DomainSearchProps {
    companies: Company[]
}

export function DomainSearchAndPurchase({ companies }: DomainSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<DomainSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searched, setSearched] = useState(false)

    // Purchase form state
    const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null)
    const [purchasing, setPurchasing] = useState(false)
    const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string } | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setError('')
        setSearched(true)
        setPurchaseResult(null)

        const result = await searchDomainsWithPricing(query)

        if (result.success) {
            setResults(result.results)
        } else {
            setError(result.error || 'Bir hata oluştu')
            setResults([])
        }

        setLoading(false)
    }

    const handlePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedDomain) return

        setPurchasing(true)
        setPurchaseResult(null)

        const formData = new FormData(e.currentTarget)

        const result = await purchaseDomain({
            domain: selectedDomain.domain,
            contactInfo: {
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                address: formData.get('address') as string,
                city: formData.get('city') as string,
                postalCode: formData.get('postalCode') as string,
                country: formData.get('country') as string,
            },
            companyId: formData.get('companyId') as string || undefined
        })

        if (result.success) {
            setPurchaseResult({ success: true, message: `${selectedDomain.domain} başarıyla satın alındı!` })
            setSelectedDomain(null)
            // Refresh search - create synthetic form event
            const syntheticEvent = { preventDefault: () => { } } as React.FormEvent
            handleSearch(syntheticEvent)
        } else {
            setPurchaseResult({ success: false, message: result.error || 'Satın alma başarısız' })
        }

        setPurchasing(false)
    }

    const formatPrice = (price: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(price)
    }

    return (
        <div className="space-y-6">
            {/* Search Box */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-8 shadow-xl">
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-white text-center mb-4">
                        Domain Sorgula & Satın Al
                    </h2>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Globe className="w-6 h-6 text-brand-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Domain adı girin... (örn: firmaismi)"
                                className="w-full pl-14 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-brand-200 text-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="px-8 py-4 bg-white text-brand-600 rounded-xl font-bold text-lg hover:bg-brand-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                            Sorgula
                        </button>
                    </div>
                    <p className="text-brand-200 text-sm mt-3 text-center">
                        Cloudflare üzerinden toptan fiyatlarla domain satın alın
                    </p>
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Purchase Result */}
            {purchaseResult && (
                <div className={`rounded-xl p-4 flex items-center gap-3 ${purchaseResult.success
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {purchaseResult.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {purchaseResult.message}
                </div>
            )}

            {/* Results */}
            {searched && !loading && results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-neutral-900">Sonuçlar</h2>

                    <div className="grid gap-4">
                        {results.map((result) => (
                            <div
                                key={result.domain}
                                className={`bg-white rounded-xl border-2 p-6 transition-all ${result.available
                                    ? 'border-green-200 hover:border-green-300 hover:shadow-lg'
                                    : 'border-neutral-200 opacity-75'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {result.available ? (
                                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                                                <XCircle className="w-6 h-6 text-neutral-400" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                                {result.domain}
                                                {result.premium && (
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                            </div>
                                            <div className="text-sm text-neutral-500 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${result.available
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-neutral-100 text-neutral-500'
                                                    }`}>
                                                    {result.available ? 'Müsait' : 'Alınmış'}
                                                </span>
                                                {result.premium && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                                        Premium
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {result.available && result.registerPrice && (
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-brand-600">
                                                {formatPrice(result.registerPrice, result.currency)}
                                            </div>
                                            <div className="text-xs text-neutral-400">
                                                Yenileme: {formatPrice(result.renewPrice || result.registerPrice, result.currency)}/yıl
                                            </div>
                                        </div>
                                    )}

                                    {result.available && (
                                        <button
                                            onClick={() => setSelectedDomain(result)}
                                            className="ml-4 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-600/30"
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                            Satın Al
                                        </button>
                                    )}
                                </div>

                                {result.error && (
                                    <p className="text-sm text-neutral-400 mt-2">{result.error}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Purchase Modal */}
            {selectedDomain && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900">Domain Satın Al</h2>
                            <p className="text-neutral-500">{selectedDomain.domain}</p>
                        </div>

                        <form onSubmit={handlePurchase} className="p-6 space-y-4">
                            <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-brand-900">{selectedDomain.domain}</div>
                                    <div className="text-sm text-brand-600">1 yıllık kayıt</div>
                                </div>
                                <div className="text-2xl font-bold text-brand-600">
                                    {formatPrice(selectedDomain.registerPrice || 0, selectedDomain.currency)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Ad *</label>
                                    <input type="text" name="firstName" required className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Soyad *</label>
                                    <input type="text" name="lastName" required className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Firma (Opsiyonel)</label>
                                <input type="text" name="organization" className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Adres *</label>
                                <input type="text" name="address" required className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Şehir *</label>
                                    <input type="text" name="city" required className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Posta Kodu *</label>
                                    <input type="text" name="postalCode" required className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Telefon *</label>
                                <input type="tel" name="phone" required placeholder="+90 5XX XXX XX XX" className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">E-posta *</label>
                                <input type="email" name="email" required className="w-full px-3 py-2 border border-neutral-200 rounded-lg" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Bağlı Firma</label>
                                <select name="companyId" className="w-full px-3 py-2 border border-neutral-200 rounded-lg">
                                    <option value="">Firma Seçin (Opsiyonel)</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>{company.name}</option>
                                    ))}
                                </select>
                            </div>

                            <input type="hidden" name="country" value="TR" />

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDomain(null)}
                                    className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={purchasing}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {purchasing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Zap className="w-5 h-5" />
                                    )}
                                    Satın Al
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
