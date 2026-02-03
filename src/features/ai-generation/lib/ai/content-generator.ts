/**
 * Content Generator Service
 * Firma bilgilerinden dinamik web sitesi içeriği üretir
 */

import { getOpenAIConnector } from './openai-connector';
import type {
    ContentType,
    CompanyInfo,
    GenerationRequest,
    GeneratedContentResult,
} from './types';

// ================================
// PROMPT TEMPLATES
// ================================

const SYSTEM_PROMPT = `Sen profesyonel bir Türk web içerik yazarısın. 
OSGB (Ortak Sağlık Güvenlik Birimi) ve iş sağlığı güvenliği sektöründe uzmanlaşmış içerikler üretiyorsun.

Kurallar:
- Her zaman Türkçe yaz (DESIGN hariç, o JSON olabilir)
- SEO-uyumlu, anahtar kelime odaklı içerik üret
- Profesyonel ama samimi bir ton kullan
- Yasal terminolojiyi doğru kullan (6331 sayılı İSG Kanunu vb.)
- İçeriği HTML formatında üret (<h2>, <p>, <ul>, <li> etiketleri kullan)
- Başlığı # ile başlat
- Meta bilgileri şu formatta ekle:
  META_TITLE: (max 60 karakter)
  META_DESCRIPTION: (max 160 karakter)
- DESIGN talebi gelirse, sadece JSON formatında renk ve stil bilgilerini dön.
`;

const CONTENT_PROMPTS: Record<ContentType, (info: CompanyInfo) => string> = {
    HOMEPAGE: (info) => `
${info.name} firması için bir anasayfa içeriği oluştur.

Firma Bilgileri:
- Firma Adı: ${info.name}
- Sektör: ${info.industry || 'İş Sağlığı ve Güvenliği (OSGB)'}
- Hizmetler: ${info.services?.join(', ') || 'İSG Hizmetleri'}
${info.description ? `- Açıklama: ${info.description}` : ''}

İçerik şunları içermeli:
1. Dikkat çekici bir başlık ve açıklama (Hero bölümü)
2. Sunulan hizmetlerin kısa tanıtımı
3. Neden bizi seçmelisiniz bölümü
4. Çağrı butonları için uygun metinler (CTA)

HTML formatında yaz.`,

    ABOUT: (info) => `
${info.name} firması için bir "Hakkımızda" sayfası içeriği oluştur.

Firma Bilgileri:
- Firma Adı: ${info.name}
- Sektör: ${info.industry || 'İş Sağlığı ve Güvenliği (OSGB)'}
${info.description ? `- Açıklama: ${info.description}` : ''}

İçerik şunları içermeli:
1. Firma hikayesi ve kuruluş amacı
2. Misyon ve vizyon
3. Değerlerimiz
4. Ekibimiz hakkında genel bilgi

Profesyonel ve güven veren bir ton kullan. HTML formatında yaz.`,

    SERVICES: (info) => `
${info.name} firması için bir "Hizmetlerimiz" sayfası içeriği oluştur.

Firma Bilgileri:
- Firma Adı: ${info.name}
- Hizmetler: ${info.services?.join(', ') || 'İşyeri Hekimliği, İş Güvenliği Uzmanlığı, Risk Değerlendirmesi, İSG Eğitimleri, Ortam Ölçümleri'}

Her hizmet için:
1. Hizmet başlığı
2. Hizmet açıklaması (2-3 paragraf)
3. Bu hizmetin faydaları

Hizmetleri <section> etiketleriyle ayır. HTML formatında yaz.`,

    CONTACT: (info) => `
${info.name} firması için bir "İletişim" sayfası içeriği oluştur.

Firma Bilgileri:
- Firma Adı: ${info.name}
- Adres: ${info.address || 'Belirtilmemiş'}
- Telefon: ${info.phone || 'Belirtilmemiş'}
- E-posta: ${info.email || 'Belirtilmemiş'}

İçerik şunları içermeli:
1. Davetkar bir başlık
2. İletişim bilgileri listesi
3. Çalışma saatleri (varsayılan: Pazartesi-Cuma 09:00-18:00)
4. İletişim formu için yönlendirme metni

HTML formatında yaz.`,

    BLOG: (info) => `
${info.name} firması için İş Sağlığı ve Güvenliği hakkında bir blog yazısı oluştur.

Konu: İşyerinde Güvenlik Kültürü Nasıl Oluşturulur?

İçerik şunları içermeli:
1. Dikkat çekici bir başlık
2. Giriş paragrafı
3. Ana içerik (3-4 alt başlık ile)
4. Sonuç ve çağrı

HTML formatında, SEO uyumlu yaz.`,

    FAQ: (info) => `
${info.name} firması için bir "Sıkça Sorulan Sorular" sayfası içeriği oluştur.

Firma Bilgileri:
- Firma Adı: ${info.name}
- Hizmetler: ${info.services?.join(', ') || 'İSG Hizmetleri'}

En az 8 soru-cevap oluştur. Sorular şunları kapsamalı:
1. OSGB nedir?
2. Hangi işletmeler OSGB hizmeti almak zorundadır?
3. İşyeri hekimi ve iş güvenliği uzmanı görevleri
4. Risk değerlendirmesi nedir?
5. İSG eğitimleri hakkında
6. Hizmet ücretlendirmesi
7. Sözleşme süreci
8. Denetimler hakkında

Her soru-cevabı <div class="faq-item"> içinde yaz. HTML formatında yaz.`,

    CAREERS: (info) => `
${info.name} firması için bir "Kariyer" sayfası içeriği oluştur.

Firma Bilgileri:
- Firma Adı: ${info.name}
- Sektör: ${info.industry || 'İş Sağlığı ve Güvenliği (OSGB)'}
${info.description ? `- Açıklama: ${info.description}` : ''}

İçerik şunları içermeli:
1. Neden bizimle çalışmalısınız? (Kariyer avantajları)
2. Açık pozisyonlar (İş Güvenliği Uzmanı, İşyeri Hekimi, Saha Mühendisi, Ofis Personeli gibi örnek pozisyonlar)
3. Başvuru süreci (adımlar halinde)
4. Çalışan avantajları ve yan haklar
5. Ekip kültürü hakkında kısa bilgi

Profesyonel ve davetkar bir ton kullan. HTML formatında yaz.`,

    DESIGN: (info) => `
${info.name} firması için bir web tasarım konsepti oluştur.

Firma Bilgileri:
- Firma Adı: ${info.name}
- Sektör: ${info.industry || 'İş Sağlığı ve Güvenliği (OSGB)'}
- Tehlike Sınıfı: ${info.dangerClass || 'Belirtilmemiş'}

Lütfen aşağıdaki JSON formatında site stilini belirle (Sadece JSON dön):
{
  "colors": {
    "primary": "Hex kodu (Sektöre uygun: Güven veren maviler, kırmızılar, turuncular)",
    "secondary": "Hex kodu",
    "accent": "Hex kodu",
    "background": "Hex kodu"
  },
  "typography": {
    "heading": "Modern sans-serif font ismi",
    "body": "Okunabilir font ismi"
  },
  "vibe": "minimalist | corporate | dynamic | techy",
  "hero_image_prompt": "Bu firma için yapay zeka görsel üreticiye verilecek hero görseli açıklaması"
}
`,
};

// ================================
// CONTENT GENERATOR
// ================================

export class ContentGenerator {
    private connector = getOpenAIConnector();

    /**
     * Tek sayfa içeriği üret
     */
    async generateContent(request: GenerationRequest): Promise<GeneratedContentResult> {
        const { contentType, companyInfo, additionalContext } = request;

        const promptBuilder = CONTENT_PROMPTS[contentType];
        if (!promptBuilder) {
            return {
                success: false,
                error: `Unknown content type: ${contentType}`,
                modelUsed: 'gpt-4-turbo',
            };
        }

        let prompt = promptBuilder(companyInfo);

        if (additionalContext) {
            prompt += `\n\nEk Bilgi: ${additionalContext}`;
        }

        return this.connector.generateWithSystem(SYSTEM_PROMPT, prompt);
    }

    /**
     * Tüm site içeriklerini üret
     */
    async generateFullSite(
        projectId: string,
        companyInfo: CompanyInfo
    ): Promise<Map<ContentType, GeneratedContentResult>> {
        const results = new Map<ContentType, GeneratedContentResult>();
        const contentTypes: ContentType[] = ['DESIGN', 'HOMEPAGE', 'ABOUT', 'SERVICES', 'CONTACT', 'FAQ', 'CAREERS'];

        for (const contentType of contentTypes) {
            const result = await this.generateContent({
                projectId,
                contentType,
                companyInfo,
            });
            results.set(contentType, result);

            // Rate limiting için kısa bekleme
            await this.sleep(500);
        }

        return results;
    }

    /**
     * Blog yazısı üret
     */
    async generateBlogPost(
        companyInfo: CompanyInfo,
        topic: string
    ): Promise<GeneratedContentResult> {
        const prompt = `
${companyInfo.name} firması için "${topic}" konusunda bir blog yazısı oluştur.

İçerik şunları içermeli:
1. SEO uyumlu başlık
2. Giriş paragrafı (okuyucuyu çeken)
3. Ana içerik (3-4 alt başlık ile, her biri 2-3 paragraf)
4. Sonuç ve çağrı

Yazı uzunluğu: yaklaşık 1000-1500 kelime
HTML formatında, SEO uyumlu yaz.`;

        return this.connector.generateWithSystem(SYSTEM_PROMPT, prompt);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// ================================
// SINGLETON FACTORY
// ================================

let generatorInstance: ContentGenerator | null = null;

export function getContentGenerator(): ContentGenerator {
    if (!generatorInstance) {
        generatorInstance = new ContentGenerator();
    }
    return generatorInstance;
}
