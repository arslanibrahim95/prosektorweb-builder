'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import { sanitizeHtml } from '@/shared/lib/sanitize';

interface Section {
    id: string;
    title?: string;
    content: string;
}

interface DynamicPageRendererProps {
    title?: string;
    htmlContent: string;
    companyName: string;
    design?: any;
    contentType: string;
}

export function DynamicPageRenderer({
    title,
    htmlContent,
    companyName,
    design,
    contentType,
}: DynamicPageRendererProps) {
    // Sanitize HTML before rendering
    const sanitizedContent = sanitizeHtml(htmlContent);

    return (
        <div className="animate-in fade-in duration-700">
            {/* Page Header (Optional based on content type) */}
            {contentType !== 'HOMEPAGE' && (
                <div className="bg-neutral-50 border-b border-neutral-100 py-16">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 font-serif mb-4">
                            {title || companyName}
                        </h1>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div
                    className="prose prose-lg max-w-none prose-brand prose-headings:font-serif prose-headings:text-neutral-900 prose-p:text-neutral-600 prose-li:text-neutral-600 prose-strong:text-neutral-900 prose-img:rounded-3xl shadow-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
            </div>

            {/* CTA Section (Always included for better conversion) */}
            <section className="bg-brand-600 py-20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Güvenliğiniz İçin Profesyonel Çözümler
                    </h2>
                    <p className="text-brand-100 mb-10 max-w-2xl mx-auto text-lg">
                        {companyName} olarak iş sağlığı ve güvenliğinde en yüksek standartları sunuyoruz.
                    </p>
                    <button className="bg-white text-brand-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-brand-50 transition-all shadow-xl shadow-brand-900/20">
                        Hemen Teklif Alın
                    </button>
                </div>
            </section>
        </div>
    );
}
