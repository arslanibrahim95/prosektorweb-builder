'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DemoNavbarProps {
    companyName: string;
    slug: string;
}

export function DemoNavbar({ companyName, slug }: DemoNavbarProps) {
    const pathname = usePathname();

    const navItems = [
        { label: 'Anasayfa', href: `/demo/${slug}` },
        { label: 'Hakkımızda', href: `/demo/${slug}/about` },
        { label: 'Hizmetlerimiz', href: `/demo/${slug}/services` },
        { label: 'SSS', href: `/demo/${slug}/faq` },
        { label: 'Kariyer', href: `/demo/${slug}/careers` },
        { label: 'İletişim', href: `/demo/${slug}/contact` },
    ];

    return (
        <header className="bg-white border-b border-neutral-100 sticky top-[48px] z-40">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link href={`/demo/${slug}`} className="text-2xl font-bold text-neutral-900 tracking-tight">
                    {companyName}
                </Link>

                <nav className="hidden md:flex gap-8 items-center">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-medium transition-colors hover:text-brand-600 ${pathname === item.href ? 'text-brand-600' : 'text-neutral-500'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <button className="bg-brand-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20">
                        Teklif Alın
                    </button>
                </nav>

                <button className="md:hidden p-2 text-neutral-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
