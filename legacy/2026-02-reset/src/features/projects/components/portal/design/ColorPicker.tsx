'use client'

interface ColorPickerProps {
    label: string
    value: string
    onChange: (value: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative">
                <input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700">{label}</label>
                <input
                    type="text"
                    value={value}
                    onChange={e => {
                        if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value)
                    }}
                    className="w-28 px-2 py-1 text-sm border border-neutral-200 rounded-lg font-mono"
                    maxLength={7}
                />
            </div>
        </div>
    )
}
