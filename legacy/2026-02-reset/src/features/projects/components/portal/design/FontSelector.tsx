'use client'

const FONTS = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Poppins',
    'Montserrat',
    'Lato',
    'Raleway',
    'Nunito',
    'Source Sans 3',
    'Playfair Display',
    'Merriweather',
    'PT Serif',
]

interface FontSelectorProps {
    label: string
    value: string
    onChange: (value: string) => void
}

export function FontSelector({ label, value, onChange }: FontSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                style={{ fontFamily: value }}
            >
                {FONTS.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                    </option>
                ))}
            </select>
        </div>
    )
}
