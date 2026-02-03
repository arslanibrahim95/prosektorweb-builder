"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, options, ...props }, ref) => {
        return (
            <select
                className={cn(
                    "flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            >
                <option value="" className="bg-slate-900">Seçiniz...</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }
);
Select.displayName = "Select";

export { Select };
