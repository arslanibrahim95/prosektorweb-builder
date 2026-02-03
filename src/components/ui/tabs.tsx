"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
    const context = React.useContext(TabsContext);
    if (!context) {
        throw new Error("Tabs components must be used within a Tabs provider");
    }
    return context;
}

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

function TabsList({ children, className }: TabsListProps) {
    return (
        <div
            className={cn(
                "inline-flex h-10 items-center justify-start rounded-lg bg-white/5 p-1 text-slate-400",
                className
            )}
        >
            {children}
        </div>
    );
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
    const { value: selectedValue, onValueChange } = useTabs();
    const isActive = selectedValue === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onValueChange(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                "disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/10",
                className
            )}
        >
            {children}
        </button>
    );
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

function TabsContent({ value, children, className }: TabsContentProps) {
    const { value: selectedValue } = useTabs();

    if (selectedValue !== value) return null;

    return (
        <div
            role="tabpanel"
            className={cn("mt-4 focus-visible:outline-none", className)}
        >
            {children}
        </div>
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
