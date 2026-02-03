# AI Agent Pipeline Kuralları

> Bu doküman, web sitesi üretim pipeline'ında çalışan AI agentlerin uyması gereken kuralları tanımlar.
> Amaç: Halüsinasyon önleme, bağlam koruma, tasarım tutarlılığı ve içerik kalitesi.

---

## 1. TEMEL PRENSİPLER

### 1.1 Altın Kurallar

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ASLA bilgi uydurmayın - sadece verilen datayı kullanın     │
│  2. ASLA scope dışına çıkmayın - sadece istenen sayfaları üretin│
│  3. ASLA tasarım tokenlarını değiştirmeyin - hex kodları sabit  │
│  4. ASLA iletişim bilgisi uydurmayın - sadece verileni kullanın │
│  5. ASLA yasal/mevzuat iddiası yapmayın - doğrulanmamış bilgi X │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Context Memo Zorunluluğu

Her stage, pipeline boyunca **Context Memo** taşımalıdır:

```typescript
interface ContextMemo {
  // Değiştirilemez - INPUT stage'den gelir
  readonly companyName: string;
  readonly industry: string;
  readonly tone: "professional" | "friendly" | "formal" | "casual";
  readonly targetAudience: string[];
  readonly allowedPages: string[];
  readonly allowedServices: string[];

  // Değiştirilemez - DESIGN stage'den gelir
  readonly colors: {
    primary: string;    // #XXXXXX formatı
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  readonly fonts: {
    heading: string;
    body: string;
  };

  // Değiştirilemez - Müşteriden gelen bilgiler
  readonly contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
    // ASLA uydurmayın!
  };

  // Takip için
  readonly focusKeywords: string[];
  readonly competitors: string[];
}
```

---

## 2. HALÜSİNASYON ÖNLEMEKuralları

### 2.1 Yasak Üretimler

| Kategori | YASAK | İZİN VERİLEN |
|----------|-------|--------------|
| Şirket Tarihi | "2015'te kuruldu" | Sadece müşteri verisi |
| İletişim | "0212 XXX XX XX" | Sadece verilen numara |
| Referanslar | "500+ müşteri" | Sadece doğrulanmış veri |
| Sertifikalar | "ISO 9001" | Sadece belgelenmiş |
| Yasal İddia | "TSE onaylı" | ASLA iddia etme |
| Konum | "Kadıköy, İstanbul" | Sadece verilen adres |

### 2.2 Doğrulama Gerektiren Alanlar

```yaml
KRITIK - Kesinlikle Doğrulanmalı:
  - Telefon numaraları
  - E-posta adresleri
  - Fiziksel adresler
  - Fiyatlandırma bilgileri
  - Yasal mevzuat referansları
  - Sertifika/belge iddiaları

YÜKSEK - Tercihen Doğrulanmalı:
  - Kuruluş tarihi
  - Çalışan sayısı
  - Müşteri sayısı
  - Proje sayısı

ORTA - Makul Tahmin Kabul:
  - Sektör tanımı
  - Hizmet açıklamaları (genel)
  - Değer önerileri
```

### 2.3 Halüsinasyon Tespit Kalıpları

Agent çıktısında şunlar varsa **RED FLAG**:

```regex
# Tarih iddiası
/kuruldu|founded|established|since \d{4}/i

# Sayısal iddia
/\d+\+? (müşteri|proje|yıl|çalışan)/i

# Sertifika iddiası
/ISO|TSE|CE|TÜRKAK|onaylı|sertifikalı/i

# İletişim bilgisi (kullanıcı vermemişse)
/0[0-9]{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/
/@[a-z]+\.(com|tr|net)/i

# Konum iddiası
/(merkez|şube|ofis).*(bulunmaktadır|yer almaktadır)/i
```

---

## 3. BAĞLAM KORUMA Kuralları

### 3.1 Stage Geçişlerinde Zorunlu Taşınan Veriler

```
INPUT ──────────────────────────────────────────────────────────►
  │
  ├── companyName      → Tüm stage'lerde AYNI kalmalı
  ├── industry         → RESEARCH, CONTENT, SEO'da kullanılmalı
  ├── tone             → CONTENT'te ses tonu belirler
  ├── targetAudience   → CONTENT'te dil seviyesi belirler
  └── allowedPages     → CONTENT'te sadece bunlar üretilmeli

RESEARCH ───────────────────────────────────────────────────────►
  │
  ├── focusKeywords    → SEO ve CONTENT'te kullanılmalı
  ├── competitors      → DESIGN'da diferansiyasyon için
  └── industryInsights → CONTENT'te terminoloji için

DESIGN ─────────────────────────────────────────────────────────►
  │
  ├── colors.*         → IMAGES ve BUILD'da AYNI hex kullanılmalı
  ├── fonts.*          → BUILD'da AYNI font kullanılmalı
  └── layout.*         → BUILD'da AYNI layout kullanılmalı
```

### 3.2 Bağlam Kaybı Belirtileri

| Belirti | Örnek | Düzeltme |
|---------|-------|----------|
| Ton kayması | Profesyonel→Samimi | tone değerini kontrol et |
| Renk sapması | #1E40AF → #2563EB | colors.primary kullan |
| Sayfa ekleme | FAQ sayfası (istenmedi) | allowedPages kontrol et |
| Servis ekleme | "Danışmanlık" (listede yok) | allowedServices kontrol et |
| Keyword kaybı | Anahtar kelime yok | focusKeywords referans al |

### 3.3 Her Stage Başında Kontrol Listesi

```typescript
function validateContextIntegrity(memo: ContextMemo, stage: PipelineStage): void {
  // 1. Firma adı kontrolü
  if (!memo.companyName || memo.companyName.length < 2) {
    throw new Error("Context kaybı: companyName eksik");
  }

  // 2. Renk kodları kontrolü (DESIGN sonrası)
  if (stage !== "input" && stage !== "research") {
    if (!memo.colors?.primary?.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new Error("Context kaybı: Geçersiz primary color");
    }
  }

  // 3. Sayfa listesi kontrolü
  if (stage === "content" || stage === "build") {
    if (!memo.allowedPages || memo.allowedPages.length === 0) {
      throw new Error("Context kaybı: allowedPages boş");
    }
  }
}
```

---

## 4. TASARIM TUTARLILIĞI Kuralları

### 4.1 Renk Token Kuralları

```yaml
Renk Kullanım Matrisi:
  primary:
    - Hero gradient başlangıç
    - CTA butonları
    - Aktif linkler
    - Önemli başlıklar

  secondary:
    - Hero gradient bitiş
    - İkincil butonlar
    - Hover durumları

  accent:
    - Vurgu elementleri
    - Badge/etiketler
    - İkonlar

  background:
    - Sayfa arka planı
    - Kart arka planları (açık ton)

  text:
    - Paragraf metinleri
    - Liste öğeleri
```

### 4.2 IMAGES Stage Kuralları

```yaml
Hero Görseli:
  - Boyut: 1920x1080
  - Renk paleti: colors.primary ve colors.secondary içermeli
  - Stil: layout.heroType ile uyumlu (gradient/image/split)
  - YASAK: Logo, metin, watermark içermemeli

Feature İkonları:
  - Boyut: 256x256
  - Stil: Flat, tek renk (colors.accent)
  - Format: SVG tercih, PNG fallback
  - YASAK: 3D, gölgeli, çok renkli

Arka Plan Desenleri:
  - Boyut: 1920x1080
  - Opaklık: %5-15 (subtle)
  - Renk: colors.primary veya colors.secondary
  - YASAK: Dikkat dağıtıcı, yoğun desenler
```

### 4.3 BUILD Stage Tasarım Uyumu

```typescript
// BUILD stage'de tasarım tokenlarını ZORLA kullan
const designTokens = {
  colors: memo.colors,  // ASLA hardcode etme
  fonts: memo.fonts,    // ASLA değiştirme
  spacing: {
    // Tutarlı spacing scale
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },
  borderRadius: {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    full: "9999px",
  },
};
```

---

## 4.5 UI/UX STAGE KURALLARI

### Lighthouse Minimum Skorları

| Metrik | Minimum | Hedef | Kritik |
|--------|---------|-------|--------|
| Performance | 70 | 90+ | <50 FAIL |
| Accessibility | 90 | 100 | <80 FAIL |
| Best Practices | 80 | 100 | <60 FAIL |
| SEO | 90 | 100 | <80 FAIL |

### Renk Kontrast Gereksinimleri (WCAG 2.1)

```yaml
Normal Metin (18px altı):
  - AA: minimum 4.5:1
  - AAA: minimum 7:1

Büyük Metin (18px+ veya 14px bold):
  - AA: minimum 3:1
  - AAA: minimum 4.5:1

UI Elementleri:
  - Butonlar: minimum 3:1
  - Form inputları: minimum 3:1
  - İkonlar: minimum 3:1
```

### Responsive Breakpoints

```yaml
Mobile:
  - Min: 320px
  - Max: 480px
  - Kontroller:
    - Viewport meta tag
    - Touch target >= 44px
    - Yatay scroll YOK
    - Font-size >= 16px

Tablet:
  - Min: 481px
  - Max: 768px
  - Kontroller:
    - Navigation responsive
    - Grid layout uyumu
    - Image scaling

Desktop:
  - Min: 769px
  - Kontroller:
    - Max-width container
    - Multi-column layout
    - Hover states
```

### Erişilebilirlik (a11y) Zorunlulukları

```yaml
KRITIK (FAIL):
  - Tüm img'lerde alt attribute
  - Form label'ları bağlı
  - HTML lang attribute
  - Main landmark mevcut

CIDDI (WARNING):
  - Keyboard navigation çalışır
  - Focus states görünür
  - Skip navigation linki
  - ARIA labels doğru

ORTA (INFO):
  - Color-only information YOK
  - Reduced motion desteği
  - Semantic HTML kullanımı
```

### Typography Hiyerarşi Kuralları

```yaml
Zorunlu:
  - Sayfada TAM 1 adet H1
  - H1 → H2 → H3 sırası (atlama YOK)
  - Design'daki fontlar kullanılmalı

Önerilen:
  - Heading font: başlıklarda
  - Body font: paragraf metinlerinde
  - Line-height: 1.5 - 1.7
  - Max satır genişliği: 75 karakter
```

### Form UX Gereksinimleri

```yaml
Zorunlu:
  - Submit button mevcut
  - Validation attributes (required, type, pattern)
  - Label-input bağlantısı

Önerilen:
  - Placeholder text
  - Autocomplete attributes
  - Error state göstergesi
  - Success state göstergesi
  - Fieldset/legend (gruplu inputlar için)
```

### Loading State Gereksinimleri

```yaml
Önerilen Pattern'ler:
  - Spinner/loading indicator
  - Skeleton loading (içerik kartları için)
  - Progress bar (uzun işlemler için)
  - Lazy loading (görseller için)
  - Async/defer scripts

Performans:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
```

---

## 4.6 OSGB YEREL SEO KURALLARI

### Hizmet Alani Mantigi

```yaml
OSGB Hizmet Alani:
  - Kendi ili (tum ilceler dahil)
  - Sinir komsusu iller (tum ilceler dahil)

Ornek - Istanbul OSGB:
  - Istanbul: 39 ilce
  - Kocaeli: 12 ilce (komsu)
  - Tekirdag: 11 ilce (komsu)
  = Toplam: 3 il, 62 ilce
```

### URL Yapisi

```yaml
Tercih Edilen Pattern:
  Il Sayfasi: /{il}-{hizmet}/
  Ilce Sayfasi: /{il}-{hizmet}/{ilce}/

Ornekler:
  - /istanbul-isyeri-hekimi/
  - /istanbul-isyeri-hekimi/kadikoy/
  - /kocaeli-risk-analizi/
  - /kocaeli-risk-analizi/gebze/
```

### Sayfa Yapisi Kurallari

```yaml
Her Lokasyon Sayfasinda:
  Zorunlu:
    - H1: "{Lokasyon} {Hizmet Adi}"
    - Hero section (CTA ile)
    - Hizmet tanimi (lokasyon odakli)
    - Yasal zorunluluk bilgisi
    - Hizmet bolgesi (komsu iller)
    - SSS (lokasyon bazli)
    - Iletisim CTA

  SEO Meta:
    - Title: "{Ilce}, {Il} {Hizmet} | {Firma}"
    - Description: "{Lokasyon} bolgesinde {hizmet}..."
    - Keywords: lokasyon + hizmet kombinasyonlari

  Schema.org:
    - LocalBusiness veya ProfessionalService
    - areaServed: Il + Komsu Iller
    - serviceType: Hizmet listesi
```

### Keyword Stratejisi

```yaml
Primary Keywords (Her sayfa icin):
  - "{sehir} {hizmet}"
  - "{ilce} {hizmet}"
  - "{sehir} osgb"

Secondary Keywords:
  - "{hizmet} fiyatlari {sehir}"
  - "{sehir} {hizmet} firmalari"
  - "{ilce} is guvenligi"

Long-tail Keywords:
  - "{sehir}'da isyeri hekimi nasil bulunur"
  - "{ilce} bolgesinde osgb hizmeti"
  - "{sehir} {hizmet} ucretleri {yil}"
```

### Ic Baglanti Kurallari

```yaml
Her Sayfadan Baglantilar:
  - Ayni hizmet, farkli lokasyonlar (3-5 adet)
  - Ayni lokasyon, farkli hizmetler (3-5 adet)
  - Komsu il sayfalari (2-3 adet)

Breadcrumb:
  Ana Sayfa > Hizmet > Il > Ilce
```

### Icerik Minimum Standartlari

```yaml
Il Sayfasi:
  - Minimum 800 kelime
  - En az 5 H2 basligi
  - En az 1 tablo veya liste
  - En az 5 SSS

Ilce Sayfasi:
  - Minimum 500 kelime
  - En az 3 H2 basligi
  - En az 3 SSS
  - Il sayfasina referans
```

### Sayfa Sayisi Hesaplama

```yaml
Formul:
  Toplam Sayfa = (Il Sayisi + Ilce Sayisi) x Hizmet Sayisi

Ornek - Istanbul OSGB (4 zorunlu hizmet):
  - Iller: 3 (Istanbul, Kocaeli, Tekirdag)
  - Ilceler: ~62
  - Hizmetler: 4
  - Toplam: (3 + 62) x 4 = 260 sayfa

Tum Turkiye (81 il):
  - Her il kendi + komsulari
  - Ortalama 4-6 komsu il
  - ~922 ilce toplam
  - Mukerrer sayfalari cikart
```

---

## 5. İÇERİK KALİTESİ Kuralları

### 5.1 Metin Kalite Standartları

```yaml
Okunabilirlik:
  - Ortalama cümle uzunluğu: 15-20 kelime
  - Paragraf uzunluğu: 3-5 cümle
  - Pasif cümle oranı: <%20
  - Flesch-Kincaid skoru: 60-70 (Türkçe adaptasyonu)

Anahtar Kelime Kullanımı:
  - Primary keyword: Başlıkta + ilk paragrafta
  - Her 200 kelimede en az 1 keyword mention
  - Keyword stuffing YASAK (>%3 yoğunluk)

CTA (Call-to-Action):
  - Her sayfada en az 1 CTA
  - Hero section'da mutlaka CTA
  - CTA metni aksiyon odaklı: "Hemen Başlayın", "Teklif Alın"
```

### 5.2 Sayfa Bazlı İçerik Kuralları

```yaml
Homepage:
  min_words: 500
  max_words: 1500
  required_sections:
    - hero (başlık + alt başlık + CTA)
    - features (3-6 özellik)
    - about_preview (firma tanıtım)
    - cta_section (iletişim yönlendirme)
  forbidden:
    - Detaylı fiyatlandırma
    - Uzun form içerik

About:
  min_words: 400
  max_words: 1000
  required_sections:
    - company_story
    - mission_vision
    - team_intro (opsiyonel)
  forbidden:
    - Doğrulanmamış tarih/sayı
    - Rakip karşılaştırması

Services:
  min_words: 300 (per service)
  max_words: 600 (per service)
  required_sections:
    - service_description
    - benefits (3-5 madde)
    - cta
  forbidden:
    - Kesin fiyat (onay olmadan)
    - Garanti vaadi

Contact:
  min_words: 100
  max_words: 300
  required_sections:
    - contact_form
    - contact_info (sadece verilen)
    - map_embed (adres varsa)
  forbidden:
    - Uydurma iletişim bilgisi
    - Çalışma saati (onay olmadan)
```

### 5.3 Tekrar Önleme

```yaml
YASAK Kalıplar:
  - Aynı cümle 2+ sayfada
  - "Profesyonel hizmet" 3+ kez
  - "Müşteri memnuniyeti" 3+ kez
  - "Kaliteli çözümler" 3+ kez
  - Aynı CTA metni tüm sayfalarda

Çeşitlilik Kuralları:
  - Her sayfa farklı hero başlık
  - Her sayfa farklı CTA metni
  - Sıfatlar değişken olmalı
  - Cümle yapıları çeşitli olmalı
```

---

## 6. SEO KURALLARI

### 6.1 Teknik SEO Zorunlulukları

```yaml
Meta Tags:
  title:
    length: 50-60 karakter
    format: "{Sayfa Adı} | {Firma Adı}"
    keyword: İlk 10 kelimede

  description:
    length: 150-160 karakter
    format: Aksiyon odaklı, keyword içeren
    cta: Soft CTA ile bitir

  canonical:
    required: true
    format: Tam URL, trailing slash tutarlı

Heading Hiyerarşisi:
  h1: Sayfada TAM 1 adet
  h2: Ana section'lar için
  h3: Alt section'lar için
  h4+: Gerektiğinde
  YASAK: H1 → H3 atlama, H2 → H4 atlama
```

### 6.2 Structured Data Kuralları

```yaml
Zorunlu Schema'lar:
  Organization:
    - name: companyName (memo'dan)
    - url: domain
    - logo: varsa
    - contactPoint: verilen iletişim

  WebSite:
    - name: siteName
    - url: domain
    - potentialAction: SearchAction (opsiyonel)

  LocalBusiness (yerel hizmet ise):
    - name, address, telephone
    - geo (koordinat varsa)
    - openingHours (onay varsa)

YASAK:
  - Doğrulanmamış aggregateRating
  - Uydurma review/testimonial
  - Sahte priceRange
```

---

## 7. STAGE-BAZLI KONTROL NOKTALARI

### 7.1 Validation Checkpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE CHECKPOINT MAP                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT ──►[✓ Context Memo oluşturuldu mu?]                      │
│       │                                                          │
│       ▼                                                          │
│  RESEARCH ──►[✓ Keywords 5-10 arası mı?]                        │
│          │   [✓ Competitor data doğrulanabilir mi?]             │
│          ▼                                                       │
│  DESIGN ──►[✓ Tüm hex kodları valid mi?]                        │
│        │   [✓ Font Google Fonts'ta var mı?]                     │
│        ▼                                                         │
│  IMAGES ──►[✓ Renk paleti design ile uyumlu mu?]                │
│        │   [✓ Boyutlar spec'e uygun mu?]                        │
│        ▼                                                         │
│  CONTENT ──►[✓ allowedPages dışında sayfa var mı?]              │
│         │   [✓ Halüsinasyon pattern'i var mı?]                  │
│         │   [✓ Her sayfa min_words'ü geçiyor mu?]               │
│         ▼                                                        │
│  SEO ──►[✓ Her sayfa unique title mı?]                          │
│     │   [✓ H1 her sayfada 1 adet mi?]                           │
│     │   [✓ Schema.org valid mi?]                                │
│     ▼                                                            │
│  BUILD ──►[✓ Design tokenları kullanılmış mı?]                  │
│       │   [✓ Responsive breakpoint'ler doğru mu?]               │
│       ▼                                                          │
│  UI_UX ──►[✓ Lighthouse skorları yeterli mi?]                   │
│       │   [✓ Renk kontrastı WCAG uyumlu mu?]                    │
│       │   [✓ Typography hiyerarşisi doğru mu?]                  │
│       │   [✓ Form UX standartlara uygun mu?]                    │
│       │   [✓ Loading state'ler mevcut mu?]                      │
│       ▼                                                          │
│  REVIEW ──►[✓ a11y kritik hata var mı?]                         │
│        │   [✓ Tüm linkler çalışıyor mu?]                        │
│        │   [✓ UI/UX skoru yeterli mi?]                          │
│        ▼                                                         │
│  PUBLISH ──►[✓ SSL aktif mi?]                                   │
│          │   [✓ DNS propagate oldu mu?]                         │
│          ▼                                                       │
│         DONE                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Hata Kurtarma Prosedürleri

```yaml
Halüsinasyon Tespit Edildiğinde:
  1. İlgili içeriği işaretle
  2. Context Memo'dan doğru veriyi al
  3. Sadece doğrulanmış veri ile yeniden üret
  4. Audit log'a kaydet

Bağlam Kaybı Tespit Edildiğinde:
  1. Son valid state'e dön
  2. Context Memo'yu yeniden yükle
  3. Stage'i baştan çalıştır
  4. Cross-check ile doğrula

Tasarım Uyumsuzluğu Tespit Edildiğinde:
  1. Design stage output'unu referans al
  2. Token override'ları temizle
  3. Hardcode değerleri design token ile değiştir
  4. Visual regression test çalıştır

Kalite Skoru Düşük Olduğunda:
  1. Spesifik sorunları listele
  2. İlgili section'ları yeniden üret
  3. A/B compare yap
  4. Daha yüksek skorlu versiyonu seç
```

---

## 8. AI MODEL-SPESİFİK KURALLAR

### 8.1 Gemini (Research & SEO)

```yaml
Güçlü Yönler:
  - Büyük context window
  - Güncel bilgi
  - Hızlı response

Dikkat Edilecekler:
  - Competitor URL'leri doğrulanmalı
  - Tarih bilgileri çapraz kontrol edilmeli
  - Mevzuat bilgileri için güvenilir kaynak iste

Prompt Kuralları:
  - "Sadece doğrulanabilir bilgi ver"
  - "Kaynak belirt veya 'bilinmiyor' de"
  - "Tahmin yapma, veri yoksa belirt"
```

### 8.2 GLM-4 (Design & Content)

```yaml
Güçlü Yönler:
  - Yapısal JSON output
  - Tutarlı format
  - Maliyet etkin

Dikkat Edilecekler:
  - Türkçe karakter encoding
  - Uzun içeriklerde kesme riski
  - Yaratıcılık sınırlı olabilir

Prompt Kuralları:
  - "JSON formatında döndür"
  - "Şu şemaya uy: {...}"
  - "Türkçe karakterleri koru"
```

### 8.3 Claude (Build & Review)

```yaml
Güçlü Yönler:
  - En iyi kod kalitesi
  - Detaylı reasoning
  - Güvenlik farkındalığı

Dikkat Edilecekler:
  - Uzun kod için token limiti
  - Over-engineering eğilimi
  - Bazen çok verbose

Prompt Kuralları:
  - "Minimal, production-ready kod"
  - "Yorum ekleme, kod açık olsun"
  - "Security best practices uygula"
```

### 8.4 Codex/GPT-4o (Review)

```yaml
Güçlü Yönler:
  - Kod analizi
  - Bug detection
  - Refactoring önerileri

Dikkat Edilecekler:
  - False positive güvenlik uyarıları
  - Bazen gereksiz optimizasyon önerisi
  - Context limit

Prompt Kuralları:
  - "Kritik güvenlik açıklarına odaklan"
  - "Sadece gerçek sorunları raporla"
  - "Çözüm önerisi ile birlikte sun"
```

---

## 9. MONITORING & LOGGING

### 9.1 Zorunlu Log Noktaları

```typescript
interface PipelineAuditLog {
  pipelineRunId: string;
  stage: PipelineStage;
  timestamp: Date;

  // Context integrity
  contextMemoHash: string;  // MD5 of memo
  contextDrift: boolean;

  // Quality metrics
  qualityScore?: number;
  hallucinationFlags: string[];

  // Performance
  durationMs: number;
  tokensUsed: number;

  // Errors
  errors: string[];
  warnings: string[];

  // Recovery
  retryCount: number;
  recoveryActions: string[];
}
```

### 9.2 Alert Thresholds

```yaml
CRITICAL (Pipeline Durdur):
  - hallucinationFlags.length > 3
  - contextDrift: true (2+ stage)
  - qualityScore < 40
  - errors.includes("VALIDATION_FAILED")

WARNING (İnceleme Gerekli):
  - hallucinationFlags.length > 0
  - qualityScore < 60
  - retryCount > 2
  - durationMs > stage.expectedDuration * 2

INFO (Log Only):
  - warnings.length > 0
  - tokensUsed > stage.expectedTokens
```

---

## 10. CHECKLIST: YENİ PIPELINE BAŞLATMADAN ÖNCE

```markdown
## Pre-Flight Checklist

### Müşteri Verisi
- [ ] Firma adı doğru mu?
- [ ] İletişim bilgileri tam mı?
- [ ] Hangi sayfalar isteniyor?
- [ ] Hangi hizmetler sunuluyor?
- [ ] Marka tonu ne olmalı?
- [ ] Hedef kitle kim?

### Teknik Hazırlık
- [ ] Domain belirlendi mi?
- [ ] Hosting platformu seçildi mi?
- [ ] SSL sertifikası hazır mı?
- [ ] DNS erişimi var mı?

### Kısıtlamalar
- [ ] Yasal kısıtlamalar var mı? (sağlık, finans)
- [ ] Marka kılavuzu var mı?
- [ ] Rakip siteler not edildi mi?
- [ ] Bütçe/timeline belirlendi mi?

### Onaylar
- [ ] Fiyat teklifi onaylandı mı?
- [ ] İçerik sorumluluğu belirlendi mi?
- [ ] Revizyon hakkı netleşti mi?
```

---

## SONUÇ

Bu kurallar, AI agentlerin:
- **Halüsinasyon yapmamasını** (Bölüm 2)
- **Bağlamı korumasını** (Bölüm 3)
- **Tasarım tutarlılığı sağlamasını** (Bölüm 4)
- **Kaliteli içerik üretmesini** (Bölüm 5)

garantiler. Her stage'de checkpoint kontrolü yapılmalı (Bölüm 7) ve sorun tespit edildiğinde kurtarma prosedürleri uygulanmalıdır.

**Son güncelleme:** 2024-01-28
**Versiyon:** 1.0.0
