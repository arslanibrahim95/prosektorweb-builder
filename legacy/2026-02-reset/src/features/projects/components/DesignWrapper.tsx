'use client';

import React, { useMemo } from 'react';

interface DesignConfig {
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
    };
    typography?: {
        heading?: string;
        body?: string;
    };
    vibe?: string;
}

interface DesignWrapperProps {
    design?: string | DesignConfig;
    children: React.ReactNode;
}

export function DesignWrapper({ design, children }: DesignWrapperProps) {
    const config = useMemo(() => {
        if (!design) return null;
        if (typeof design === 'string') {
            try {
                return JSON.parse(design) as DesignConfig;
            } catch (e) {
                console.error('Failed to parse design JSON:', e);
                return null;
            }
        }
        return design as DesignConfig;
    }, [design]);

    // Apply CSS variables based on design
    const styles = useMemo(() => {
        if (!config) return {};

        const vars: Record<string, string> = {
            '--site-primary': config.colors?.primary || '#ef4444', // Fallback to brand-red
            '--site-secondary': config.colors?.secondary || '#1e293b',
            '--site-accent': config.colors?.accent || '#3b82f6',
            '--site-bg': config.colors?.background || '#ffffff',
            '--site-font-heading': config.typography?.heading || 'serif',
            '--site-font-body': config.typography?.body || 'sans-serif',
        };

        return vars as React.CSSProperties;
    }, [config]);

    return (
        <div
            style={styles}
            className={`min-h-screen font-body selection:bg-[var(--site-primary)] selection:text-white ${config?.vibe || 'corporate'}`}
        >
            <style jsx global>{`
                :root {
                    ${Object.entries(styles).map(([k, v]) => `${k}: ${v};`).join('\n')}
                }
                h1, h2, h3, h4, .font-serif {
                    font-family: var(--site-font-heading);
                }
                body, .font-sans {
                    font-family: var(--site-font-body);
                }
                .bg-brand-600 {
                    background-color: var(--site-primary) !important;
                }
                .text-brand-600 {
                    color: var(--site-primary) !important;
                }
                .border-brand-600 {
                    border-color: var(--site-primary) !important;
                }
                .prose-brand h2, .prose-brand h3 {
                    color: var(--site-primary);
                }
            `}</style>
            {children}
        </div>
    );
}
