'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Send, Loader2 } from 'lucide-react';

interface ContactSectionProps {
  projectId: string; // Added validation for backend submission
  phone: string | null;
  email: string | null;
  address: string | null;
  mapEmbed: string | null;
}

export function ContactSection({ projectId, phone, email, address, mapEmbed }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          subject: 'Website İletişim Formu',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Mesaj gönderilemedi');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Contact submission error:', error);
      alert('Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Bizimle Iletisime Gecin
          </h2>
          <p className="text-lg text-neutral-600">
            Sorulariniz icin bize ulasin, en kisa surede donelim
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Mesajiniz Alindi!
                </h3>
                <p className="text-neutral-600">
                  En kisa surede sizinle iletisime gececeğiz.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Adiniz Soyadiniz
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder="Adinizi girin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      E-posta Adresiniz
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Telefon Numaraniz
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="0532 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Mesajiniz
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                    placeholder="Mesajinizi yazin..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {submitting ? 'Gonderiliyor...' : 'Mesaj Gonder'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info & Map */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
              {phone && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">Telefon</h4>
                    <a
                      href={`tel:${phone}`}
                      className="text-neutral-600 hover:text-[var(--color-primary)]"
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              )}
              {email && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">E-posta</h4>
                    <a
                      href={`mailto:${email}`}
                      className="text-neutral-600 hover:text-[var(--color-primary)]"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">Adres</h4>
                    <p className="text-neutral-600">{address}</p>
                  </div>
                </div>
              )}
            </div>

            {mapEmbed && (
              <div
                className="rounded-2xl overflow-hidden h-64"
                dangerouslySetInnerHTML={{ __html: mapEmbed }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
