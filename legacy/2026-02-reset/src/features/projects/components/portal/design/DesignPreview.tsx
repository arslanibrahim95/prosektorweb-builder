'use client'

interface DesignPreviewProps {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    bgColor: string
    fontHeading: string
    fontBody: string
}

export function DesignPreview({ primaryColor, secondaryColor, accentColor, bgColor, fontHeading, fontBody }: DesignPreviewProps) {
    return (
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-500 font-medium">
                Canlı Önizleme
            </div>
            <div style={{ backgroundColor: bgColor }} className="p-6 min-h-[300px]">
                {/* Nav preview */}
                <div style={{ backgroundColor: primaryColor }} className="rounded-lg p-3 mb-4 flex items-center justify-between">
                    <span className="text-white font-bold text-sm" style={{ fontFamily: fontHeading }}>
                        Firma Adı
                    </span>
                    <div className="flex gap-3">
                        {['Anasayfa', 'Hakkımızda', 'İletişim'].map(item => (
                            <span key={item} className="text-white/80 text-xs" style={{ fontFamily: fontBody }}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Hero preview */}
                <div className="text-center py-6">
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: primaryColor, fontFamily: fontHeading }}
                    >
                        Hoş Geldiniz
                    </h1>
                    <p className="text-sm mb-4" style={{ color: '#666', fontFamily: fontBody }}>
                        Profesyonel hizmetlerimizle tanışın
                    </p>
                    <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: accentColor }}
                    >
                        İletişime Geçin
                    </button>
                </div>

                {/* Cards preview */}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-lg p-3 border" style={{ borderColor: `${secondaryColor}30` }}>
                            <div className="w-8 h-8 rounded mb-2" style={{ backgroundColor: `${secondaryColor}20` }} />
                            <h3 className="text-sm font-bold mb-1" style={{ color: secondaryColor, fontFamily: fontHeading }}>
                                Hizmet {i}
                            </h3>
                            <p className="text-xs text-neutral-500" style={{ fontFamily: fontBody }}>
                                Açıklama metni
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
