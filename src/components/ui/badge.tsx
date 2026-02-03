import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "success" | "warning" | "error" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                {
                    "bg-purple-500/20 text-purple-300": variant === "default",
                    "bg-green-500/20 text-green-300": variant === "success",
                    "bg-yellow-500/20 text-yellow-300": variant === "warning",
                    "bg-red-500/20 text-red-300": variant === "error",
                    "border border-white/20 text-slate-300": variant === "outline",
                },
                className
            )}
            {...props}
        />
    );
}

export { Badge };
