'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface JobApplicationFormProps {
    projectId: string;
}

export function JobApplicationForm({ projectId }: JobApplicationFormProps) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        position: '',
        coverLetter: '',
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/job-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    ...formData,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Başvuru gönderilemedi');
            }

            setStatus('success');
            setFormData({ fullName: '', email: '', phone: '', position: '', coverLetter: '' });
        } catch (err) {
            setStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Bir hata oluştu');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Başvurunuz Alındı!</h3>
                <p className="text-green-600">
                    Başvurunuz başarıyla iletildi. En kısa sürede sizinle iletişime geçeceğiz.
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-green-700 underline hover:no-underline text-sm"
                >
                    Yeni başvuru yap
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8">
            <h3 className="text-2xl font-bold text-neutral-900 mb-6">Başvuru Formu</h3>

            {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Ad Soyad <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                            placeholder="Adınız Soyadınız"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            E-posta <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                            placeholder="ornek@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                            placeholder="0 (5XX) XXX XX XX"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Başvurulan Pozisyon
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                            placeholder="Ör: İş Güvenliği Uzmanı"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Ön Yazı / Mesaj
                    </label>
                    <textarea
                        rows={4}
                        value={formData.coverLetter}
                        onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
                        placeholder="Kendinizi kısaca tanıtın..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/20"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Gönderiliyor...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Başvuru Gönder
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
