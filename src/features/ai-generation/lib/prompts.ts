/**
 * AI Prompt Templates
 * Specialized prompts for different generation tasks
 */

export const PROMPT_TEMPLATES = {
    // Analysis prompts
    ANALYZE_REQUIREMENTS: `Sen uzman bir web geliştirme danışmanısın. Kullanıcının web sitesi isteğini analiz et.

Aşağıdaki konulara odaklan:
1. İşletme türü ve sektör
2. Hedef kitle özellikleri
3. Ana hedefler ve KPI'lar
4. Gerekli özellikler ve sayfalar
5. İçerik tonu ve stili

Türkçe ve profesyonel bir dil kullan.`,

    // Design prompts
    DESIGN_SYSTEM: `Sen uzman bir UI/UX tasarımcısın. Modern ve kullanıcı dostu bir tasarım sistemi oluştur.

Dikkat edilecek noktalar:
1. Renk kontrastı ve erişilebilirlik (WCAG 2.1)
2. Tipografi hiyerarşisi
3. Responsive tasarım
4. Dark mode desteği
5. Micro-interactions

Türk kullanıcı alışkanlıklarını göz önünde bulundur.`,

    // Content prompts
    CONTENT_HERO: `Web sitesinin hero bölümü için etkileyici içerik üret.

İçermesi gerekenler:
- Dikkat çekici başlık (max 10 kelime)
- Alt başlık veya slogan
- Kısa açıklama paragrafı (2-3 cümle)
- CTA (Call to Action) butonu metni

SEO dostu ve dönüşüm odaklı yaz.`,

    CONTENT_ABOUT: `Hakkında bölümü için içerik üret.

İçermesi gerekenler:
- Şirket/kişi hikayesi
- Misyon ve vizyon
- Değerler ve prensipler
- Başarılar ve deneyim

Samimi ama profesyonel bir ton kullan.`,

    CONTENT_SERVICES: `Hizmetler bölümü için içerik üret.

Her hizmet için:
- Hizmet adı
- Kısa açıklama (1-2 cümle)
- 3-4 maddelik özellik listesi
- Fayda odaklı anlatım

Fiyat veya rakam belirtme.`,

    CONTENT_CTA: `Harekete geçirici (CTA) bölümü için içerik üret.

İçermesi gerekenler:
- Güçlü başlık
- Aciliyet yaratan alt metin
- Buton metni
- İsteğe bağlı: güven unsuru

Dönüşüm odaklı ve ikna edici ol.`,

    // Code generation prompts
    CODE_COMPONENT: `Sen senior bir React/Next.js geliştiricissin. TypeScript ve Tailwind CSS kullanarak component üret.

Kurallar:
1. Tam tip güvenliği (no any)
2. Client/Server component ayrımı
3. Erişilebilirlik (ARIA attributes)
4. Responsive tasarım
5. Performans optimizasyonu

Sadece kod üret, açıklama yapma.`,

    CODE_PAGE: `Next.js App Router için sayfa component'i üret.

İçermesi gerekenler:
1. Metadata export'u
2. Layout yapısı
3. Section'ların sıralı render'ı
4. Error boundary
5. Loading state

TypeScript ve best practices kullan.`,

    // SEO prompts
    SEO_META: `SEO uzmanı olarak meta veriler üret.

Her sayfa için:
- title (max 60 karakter)
- description (max 160 karakter)
- keywords (5-10 anahtar kelime)
- og:title, og:description
- canonical URL önerisi

Türkçe karakter desteği ile.`,

    SEO_CONTENT: `İçeriği SEO için optimize et.

Dikkat edilecekler:
1. Heading hiyerarşisi (H1-H6)
2. Anahtar kelime yoğunluğu (%1-2)
3. Internal/external link önerileri
4. Image alt text'leri
5. Schema.org markup önerileri

Doğal ve okunabilir kalsın.`,
};

/**
 * Get prompt for specific section type
 */
export function getContentPrompt(sectionType: string): string {
    const promptMap: Record<string, string> = {
        hero: PROMPT_TEMPLATES.CONTENT_HERO,
        about: PROMPT_TEMPLATES.CONTENT_ABOUT,
        services: PROMPT_TEMPLATES.CONTENT_SERVICES,
        cta: PROMPT_TEMPLATES.CONTENT_CTA,
    };

    return promptMap[sectionType] || PROMPT_TEMPLATES.CONTENT_HERO;
}

/**
 * Build complete prompt with context
 */
export function buildPrompt(
    template: string,
    context: Record<string, string>
): string {
    let prompt = template;

    for (const [key, value] of Object.entries(context)) {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return prompt;
}
