'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, Calculator } from 'lucide-react';

interface QuoteRequestFormProps {
    projectId: string;
}

export function QuoteRequestForm({ projectId }: QuoteRequestFormProps) {
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        employeeCount: '',
        hazardClass: 'unknown',
        servicesRequested: [] as string[],
        message: '',
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const services = [
        { id: 'isyeri-hekimi', label: 'İşyeri Hekimliği' },
        { id: 'is-guvenligi-uzmani', label: 'İş Güvenliği Uzmanlığı' },
        { id: 'risk-analizi', label: 'Risk Analizi' },
        { id: 'egitim', label: 'İSG Eğitimleri' },
        { id: 'saglik-taramasi', label: 'Sağlık Taraması' },
    ];

    const handleServiceChange = (serviceId: string) => {
        setFormData(prev => {
            const exists = prev.servicesRequested.includes(serviceId);
            if (exists) {
                return { ...prev, servicesRequested: prev.servicesRequested.filter(id => id !== serviceId) };
            } else {
                return { ...prev, servicesRequested: [...prev.servicesRequested, serviceId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/quote-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    ...formData,
                    employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : null,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Teklif talebi gönderilemedi');
            }

            setStatus('success');
            setFormData({
                companyName: '',
                contactName: '',
                email: '',
                phone: '',
                employeeCount: '',
                hazardClass: 'unknown',
                servicesRequested: [],
                message: '',
            });
        } catch (err) {
            setStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Bir hata oluştu');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-blue-800 mb-2">Talebiniz Alındı!</h3>
                <p className="text-blue-600">
                    Fiyat teklifi talebiniz tarafımıza ulaştı. En kısa sürede size özel teklifimizi hazırlayıp iletişime geçeceğiz.
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-blue-700 underline hover:no-underline text-sm"
                >
                    Yeni talep oluştur
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">Hızlı Teklif Al</h3>
            </div>

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
                            Firma Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.companyName}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="Firma ünvanı"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            İletişim Kişisi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.contactName}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="ornek@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Telefon <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="0 (5XX) XXX XX XX"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Çalışan Sayısı
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.employeeCount}
                            onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="Ör: 10"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Tehlike Sınıfı
                        </label>
                        <select
                            value={formData.hazardClass}
                            onChange={(e) => setFormData(prev => ({ ...prev, hazardClass: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none bg-white"
                        >
                            <option value="unknown">Bilmiyorum</option>
                            <option value="low">Az Tehlikeli (Ofis vb.)</option>
                            <option value="medium">Tehlikeli (Üretim vb.)</option>
                            <option value="high">Çok Tehlikeli (İnşaat, Maden vb.)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        İlgilendiğiniz Hizmetler
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {services.map(service => (
                            <label key={service.id} className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.servicesRequested.includes(service.id)}
                                    onChange={() => handleServiceChange(service.id)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm text-neutral-700">{service.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Ek Notlar
                    </label>
                    <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                        placeholder="Varsa belirtmek istedikleriniz..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Gönderiliyor...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Teklif İste
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
