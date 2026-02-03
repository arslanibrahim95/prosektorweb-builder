# OSGB Yerel SEO Modülü - Geliştirici Devir Raporu

> **Tarih**: 28 Ocak 2026
> **Modül**: `src/lib/pipeline/seo/`
> **Durum**: Temel altyapı hazır, veri tamamlama ve pipeline entegrasyonu bekliyor

---

## 1. PROJENİN AMACI

Türkiye genelinde **81 il** için OSGB (Ortak Sağlık Güvenlik Birimi) web siteleri üretiyoruz. Her OSGB'nin hizmet alanı şöyle çalışır:

```
Bir OSGB'nin hizmet alanı = Kendi ili + Sınır komşusu iller
Her il ve ilçe için ayrı landing page üretilecek.
```

**Örnek**: İstanbul merkezli bir OSGB:
- İstanbul (39 ilçe) → hizmet verir
- Kocaeli (12 ilçe) → sınır komşusu, hizmet verir
- Tekirdağ (11 ilçe) → sınır komşusu, hizmet verir
- Bursa → sınır komşusu **DEĞİL** (deniz var, kara sınırı yok), hizmet vermez

Her il+ilçe kombinasyonu × her hizmet = 1 ayrı SEO sayfası.

**Hedef sayfa sayısı**: Binlerce unique lokasyon sayfası (81 il × ortalama 5 komşu × ~15 ilçe × 11 hizmet).

---

## 2. DOSYA YAPISI VE SORUMLULUKLAR

```
src/lib/pipeline/seo/
├── index.ts                  # Barrel export - tüm public API burada
├── turkey-geo-data.ts        # Türkiye coğrafi verileri (il, ilçe, komşuluk)
├── osgb-services.ts          # OSGB hizmet tanımları ve keyword'ler
├── local-seo-generator.ts    # Sayfa üretici, URL builder, sitemap, schema.org
├── content-templates.ts      # Hizmet bazlı Markdown içerik şablonları
└── HANDOFF.md                # Bu dosya
```

---

## 3. HER DOSYANIN DETAYLI AÇIKLAMASI

### 3.1 `turkey-geo-data.ts`

**Ne yapar**: Türkiye'nin il-ilçe yapısını ve iller arası komşuluk ilişkisini tutar.

**Veri yapısı**:
```typescript
interface Province {
  id: number;        // Plaka kodu (1=Adana, 6=Ankara, 34=İstanbul...)
  name: string;      // "Istanbul"
  slug: string;      // "istanbul" (URL'de kullanılacak)
  region: TurkeyRegion; // "marmara", "ege", "akdeniz" vb.
  neighbors: number[];  // Komşu il plaka kodları [41, 59]
  districts: District[]; // İlçe listesi
}

interface District {
  name: string;      // "Kadıkoy"
  slug: string;      // "kadikoy"
  isCenter?: boolean; // Merkez ilçe mi (büyükşehir merkez ilçeleri)
}
```

**Mevcut durum**: Sadece **6 il** tanımlı (Adana, Ankara, İstanbul, İzmir, Kocaeli, Bursa). **75 il daha eklenmeli**.

**Önemli fonksiyonlar**:
```typescript
getProvinceById(34)              // → İstanbul Province objesi
getNeighborProvinces(34)         // → [Kocaeli, Tekirdağ]
getServiceAreaProvinces(34)      // → [İstanbul, Kocaeli, Tekirdağ] (kendi + komşular)
getServiceAreaDistricts(34)      // → [{province: İstanbul, districts: [...]}, ...]
calculateTotalPages(34)          // → {provincePages: 3, districtPages: 62, total: 65}
getIndustrialProvinces()         // → Sanayi yoğun 10 il (öncelikli SEO hedefi)
```

**⚠️ KRİTİK**: `neighbors` dizisi **kara sınırı** olan komşuları içermeli. Deniz sınırı (örn: İstanbul-Bursa arası Marmara Denizi) komşuluk sayılmaz. Kaynak olarak Türkiye idari haritası kullanılmalı.

---

### 3.2 `osgb-services.ts`

**Ne yapar**: OSGB'lerin sunduğu 11 hizmetin tanımlarını, keyword pattern'lerini ve sayfa yapısını tutar.

**Tanımlı 11 hizmet**:

| # | ID | Hizmet | Zorunlu mu? |
|---|---|---|---|
| 1 | `isyeri-hekimi` | İşyeri Hekimliği | ✅ Zorunlu |
| 2 | `is-guvenligi-uzmani` | İş Güvenliği Uzmanlığı | ✅ Zorunlu |
| 3 | `risk-analizi` | Risk Değerlendirmesi | ✅ Zorunlu |
| 4 | `isg-egitimi` | ISG Eğitimi | ✅ Zorunlu |
| 5 | `ilkyardim-egitimi` | İlkyardım Eğitimi | Opsiyonel |
| 6 | `yangin-egitimi` | Yangın Eğitimi | Opsiyonel |
| 7 | `saglik-taramasi` | Sağlık Taraması | Opsiyonel |
| 8 | `acil-durum-plani` | Acil Durum Planı | Opsiyonel |
| 9 | `isg-kurulu` | ISG Kurul Toplantıları | Opsiyonel |
| 10 | `onayli-defter` | Onaylı Defter İşlemleri | Opsiyonel |
| 11 | `isg-katip` | ISG-KATİP İşlemleri | Opsiyonel |

**Her hizmet için tanımlı**:
- `keywords.primary` → Ana anahtar kelimeler
- `keywords.secondary` → İkincil kelimeler
- `keywords.longTail` → Uzun kuyruk kelimeler
- `locationKeywordPatterns` → `"{sehir} isyeri hekimi"` gibi pattern'ler
- `requiredSections` → Sayfada olması gereken bölümler
- `legalReferences` → Yasal dayanak referansları

**Önemli fonksiyonlar**:
```typescript
getMandatoryServices()           // → 4 zorunlu hizmet (öncelikli)
generateLocationKeywords(service, "Istanbul", "Kadikoy")
  // → ["istanbul isyeri hekimi", "kadikoy isyeri hekimi", ...]
generatePageTitle(service, "Istanbul", "Kadikoy", "ABC OSGB")
  // → "Kadıkoy, Istanbul Isyeri Hekimligi | ABC OSGB"
generateMetaDescription(service, "Istanbul", "Kadikoy")
  // → "Kadıkoy ve Istanbul bolgesinde profesyonel isyeri hekimligi hizmeti..."
```

---

### 3.3 `local-seo-generator.ts`

**Ne yapar**: Coğrafi veri + hizmet verisi birleştirerek tam sayfa objeleri, URL'ler, sitemap, schema.org ve internal linking üretir.

**Ana veri yapısı** - `LocalPage`:
```typescript
interface LocalPage {
  slug: string;            // "/istanbul-isyeri-hekimi/kadikoy/"
  fullPath: string;
  canonicalUrl: string;    // "https://domain.com/istanbul-isyeri-hekimi/kadikoy/"
  title: string;           // SEO title
  metaDescription: string;
  keywords: string[];
  h1: string;              // "Kadıkoy Isyeri Hekimligi"
  province: Province;
  district?: District;
  isDistrictPage: boolean;
  service: OsgbService;
  sections: ContentSection[]; // Sayfa içerik bölümleri
  schema: LocalBusinessSchema; // JSON-LD schema
  relatedPages: string[];     // Internal linking
  breadcrumbs: BreadcrumbItem[];
}
```

**URL Pattern**:
```
İl sayfası:  /istanbul-isyeri-hekimi/
İlçe sayfası: /istanbul-isyeri-hekimi/kadikoy/
```

**Önemli fonksiyonlar**:
```typescript
// Tek sayfa üret
generateLocalPage(service, province, district, options)

// Bir OSGB'nin TÜM sayfalarını üret (il + komşular + tüm ilçeler × tüm hizmetler)
generateAllLocalPages(34, { companyName: "ABC OSGB", services: OSGB_SERVICES })
  // → 200+ LocalPage objesi

// Tam site yapısı (sayfalar + sitemap)
generateSiteStructure(34, "istanbul-osgb.com", options)
  // → { pages: [...], sitemap: [...], totalPages: 261 }

// İstatistik
calculateTotalPagesForAllProvinces()
  // → { totalProvinces: 6, totalPages: ..., breakdown: [...] }
```

**Schema.org çıktısı** (her sayfada):
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "ABC OSGB",
  "address": {
    "addressLocality": "Kadıkoy",
    "addressRegion": "Istanbul",
    "addressCountry": "TR"
  },
  "areaServed": [
    { "@type": "City", "name": "Istanbul" },
    { "@type": "AdministrativeArea", "name": "Kocaeli" },
    { "@type": "AdministrativeArea", "name": "Tekirdag" }
  ],
  "serviceType": ["Isyeri Hekimligi", "isyeri hekimi", ...]
}
```

**Internal linking stratejisi**:
Her sayfadan otomatik bağlantılar:
- Aynı hizmet, farklı 3 ilçe (aynı ildeki diğer ilçeler)
- Aynı hizmet, 2 komşu il

---

### 3.4 `content-templates.ts`

**Ne yapar**: Her hizmet için Markdown formatında içerik şablonları tutar. `{{sehir}}`, `{{ilce}}`, `{{yil}}` gibi değişkenler render zamanında doldurulur.

**Mevcut şablonlar** (3 tanesi hazır):

| Hizmet | Şablon Adı | Section Sayısı |
|--------|-----------|----------------|
| İşyeri Hekimi | `ISYERI_HEKIMI_TEMPLATE` | 7 section |
| İş Güvenliği Uzmanı | `IS_GUVENLIGI_UZMANI_TEMPLATE` | 7 section |
| Risk Analizi | `RISK_ANALIZI_TEMPLATE` | 6 section |

**Şablon değişkenleri**:
```typescript
interface TemplateVariables {
  sehir: string;       // "Istanbul"
  sehir_kucuk: string; // "istanbul"
  ilce?: string;       // "Kadikoy"
  ilce_kucuk?: string; // "kadikoy"
  bolge: string;       // "Kadikoy, Istanbul" veya "Istanbul"
  komsu_iller: string; // "Kocaeli, Tekirdag"
  hizmet: string;      // "Isyeri Hekimligi"
  hizmet_kucuk: string;// "isyeri hekimligi"
  firma?: string;      // "ABC OSGB"
  telefon?: string;
  email?: string;
  yil: number;         // 2026
}
```

**Örnek kullanım**:
```typescript
const content = renderPageContent("isyeri-hekimi", istanbulProvince, kadikoyDistrict, {
  companyName: "ABC OSGB",
  phone: "0212 555 0000",
  email: "info@abc-osgb.com",
});
// → { html: "...", plainText: "...", wordCount: 850, headings: [...] }
```

---

## 4. PIPELINE ENTEGRASYONU

Bu SEO modülü pipeline'ın **SEO stage'i** içinden çağrılacak. Mevcut pipeline akışı:

```
INPUT → RESEARCH → DESIGN → IMAGES → CONTENT → SEO → BUILD → UI_UX → REVIEW → PUBLISH
                                                 ↑
                                          BU MODÜL BURADA ÇALIŞIR
```

SEO stage handler'ı şu adımları yapmalı:

1. INPUT stage'den `province` bilgisini al (firmanın bulunduğu il)
2. `getServiceAreaProvinces(provinceId)` ile hizmet alanını belirle
3. `generateAllLocalPages()` ile tüm sayfaları üret
4. `generateSiteStructure()` ile sitemap oluştur
5. Content template'leri render et
6. Output olarak sayfa listesini, sitemap'i ve schema verilerini döndür

**Henüz yapılmadı** - SEO stage handler'da bu modülün import edilip çağrılması lazım.

---

## 5. TAMAMLANMASI GEREKEN İŞLER

### 5.1 🔴 KRİTİK: 75 İl Verisi Eksik

**Dosya**: `turkey-geo-data.ts`
**Durum**: 6 il tanımlı (Adana, Ankara, İstanbul, İzmir, Kocaeli, Bursa). **75 il daha lazım**.

**Yapılacak**:
- `TURKEY_PROVINCES` dizisine kalan 75 ili ekle
- Her il için:
  - `id`: Plaka kodu
  - `name`: İl adı
  - `slug`: URL-safe isim (türkçe karakter yok, küçük harf)
  - `region`: 7 bölgeden biri
  - `neighbors`: **Kara sınırı** komşu illerin plaka kodları
  - `districts`: Tüm ilçeleri (isim + slug + isCenter)

**Veri kaynağı önerileri**:
- Wikipedia Türkiye illeri listesi
- Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü
- TÜİK ilçe listesi

**Dikkat edilecekler**:
- **Slug'lar**: Türkçe karakter içermemeli (`ş→s`, `ç→c`, `ğ→g`, `ı→i`, `ö→o`, `ü→u`)
- **Komşuluk**: Sadece **kara sınırı** olan iller. Deniz komşuları sayılmaz
- **Büyükşehir ilçeleri**: `isCenter: true` işaretlenmeli (büyükşehir merkez ilçeleri)
- **Plaka kodu sırası**: İlleri plaka koduna göre sırala (1-81)

**Tahmini iş**: ~3-4 saat (veri toplama + formatlama + doğrulama)

---

### 5.2 🔴 KRİTİK: 8 Hizmet Şablonu Eksik

**Dosya**: `content-templates.ts`
**Durum**: 3 şablon hazır. 8 şablon daha lazım.

**Yazılması gereken şablonlar**:

| # | Service ID | Şablon | Özel Dikkat |
|---|-----------|--------|-------------|
| 1 | `isg-egitimi` | ISG eğitimi | Eğitim türleri ve süreleri tablosu olmalı |
| 2 | `ilkyardim-egitimi` | İlkyardım | Sertifika bilgisi, kaç kişiye 1 ilkyardımcı |
| 3 | `yangin-egitimi` | Yangın | Tatbikat bilgisi, ekipman tanıtımı |
| 4 | `saglik-taramasi` | Sağlık taraması | Muayene türleri listesi, geçerlilik süreleri |
| 5 | `acil-durum-plani` | Acil durum | Plan içeriği, ekip oluşturma |
| 6 | `isg-kurulu` | ISG kurulu | Kurul üyeleri, toplantı esasları |
| 7 | `onayli-defter` | Onaylı defter | Defter türleri, onaylama süreci |
| 8 | `isg-katip` | ISG-KATİP | Sistem tanıtımı, bildirim türleri |

**Her şablon için**:
- `osgb-services.ts`'deki `requiredSections` dizisine bak → o section'ları yaz
- En az 5-7 section olmalı (hero, tanım, detay, SSS, CTA)
- `{{sehir}}`, `{{ilce}}`, `{{bolge}}`, `{{yil}}`, `{{komsu_iller}}`, `{{firma}}`, `{{telefon}}`, `{{email}}` değişkenlerini kullan
- SSS'lerde en az 4-5 soru olmalı
- İl sayfası için 800+ kelime, ilçe sayfası için 500+ kelime hedefle
- Her şablonu `CONTENT_TEMPLATES` objesine kaydet

**Mevcut şablonlara bak** (`ISYERI_HEKIMI_TEMPLATE`) yapıyı anlamak için.

---

### 5.3 🟡 ORTA: Pipeline SEO Stage Entegrasyonu

**Dosya**: Yeni handler yazılacak veya mevcut SEO stage handler güncellenecek

**Yapılacak**:
1. SEO stage handler'da `src/lib/pipeline/seo` modülünü import et
2. INPUT stage çıktısından firma ilini al
3. Hizmet alanı sayfalarını üret
4. Sitemap oluştur
5. SEO stage output'una ekle

---

### 5.4 🟡 ORTA: Sitemap XML Generator

**Dosya**: `local-seo-generator.ts` veya yeni dosya

**Mevcut**: `SitemapEntry[]` objesi üretiliyor ama XML formatına dönüştürülmüyor.

**Yapılacak**:
```typescript
function generateSitemapXml(entries: SitemapEntry[]): string {
  // XML header + urlset
  // Her entry için <url><loc>...</loc>...</url>
  // Sitemap index (1000+ URL varsa split)
}
```

Büyük sitelerde (1000+ URL) sitemap index dosyası lazım:
```xml
<sitemapindex>
  <sitemap><loc>sitemap-istanbul.xml</loc></sitemap>
  <sitemap><loc>sitemap-kocaeli.xml</loc></sitemap>
</sitemapindex>
```

---

### 5.5 🟢 DÜŞÜK: İlçe Nüfus Verileri

**Dosya**: `turkey-geo-data.ts` - `District.population` alanı mevcut ama doldurulmamış

**Neden lazım**: Nüfusu yüksek ilçeler SEO'da öncelikli olmalı. Sayfa üretim sırasını ve sitemap priority değerini etkiler.

---

### 5.6 🟢 DÜŞÜK: Sektör Bazlı İçerik

**Dosya**: `osgb-services.ts`'de `targetSectors` alanı var ama kullanılmıyor

**Yapılacak**: Risk analizi gibi sektöre özel hizmetlerde, sektör bazlı sayfalar da üretilebilir:
```
/istanbul-risk-analizi/insaat/
/istanbul-risk-analizi/gida/
/istanbul-risk-analizi/kimya/
```

Bu iş şu an öncelikli değil, ama altyapı hazır.

---

## 6. KURALLAR VE STANDARTLAR

### URL Kuralları
- Pattern: `/{il}-{hizmet}/{ilce}/`
- Türkçe karakter yok: `ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u`
- Tümü küçük harf
- Sonunda `/` var

### İçerik Kuralları
- İl sayfası: minimum 800 kelime, 5+ H2
- İlçe sayfası: minimum 500 kelime, 3+ H2
- Her sayfada 1 adet H1 (sadece 1)
- H1→H2→H3 sırası atlanmaz
- Her sayfada SSS bölümü (en az 3 soru)
- Her sayfada CTA (telefon + form)

### SEO Kuralları
- Her sayfa benzersiz title ve description
- Title pattern: `{İlçe}, {İl} {Hizmet} | {Firma}`
- Description pattern: `{Lokasyon} bölgesinde {hizmet}...`
- Schema.org JSON-LD her sayfada (LocalBusiness/ProfessionalService)
- Canonical URL her sayfada
- Internal linking: 3-5 ilgili sayfa bağlantısı

### Komşuluk Kuralları
- Sadece kara sınırı (deniz komşuları sayılmaz)
- Kaynak: Türkiye idari sınır haritası
- Neighbors dizisi karşılıklı olmalı (A→B ise B→A da olmalı)

---

## 7. HIZLI BAŞLANGIÇ

### Modülü test et
```typescript
import {
  getServiceAreaProvinces,
  generateSiteStructure,
  OSGB_SERVICES,
} from "@/lib/pipeline/seo";

// İstanbul için site yapısı
const site = generateSiteStructure(34, "istanbul-osgb.com", {
  companyName: "Test OSGB",
  services: OSGB_SERVICES,
  includeDistricts: true,
});

console.log(`Toplam sayfa: ${site.totalPages}`);
console.log(`İlk sayfa: ${site.pages[0].title}`);
console.log(`İlk sayfa URL: ${site.pages[0].fullPath}`);
```

### Tek sayfa render et
```typescript
import { renderPageContent, getProvinceById } from "@/lib/pipeline/seo";

const istanbul = getProvinceById(34)!;
const kadikoy = istanbul.districts.find(d => d.slug === "kadikoy")!;

const content = renderPageContent("isyeri-hekimi", istanbul, kadikoy, {
  companyName: "ABC OSGB",
  phone: "0212 555 0000",
  email: "info@abc.com",
});

console.log(`Kelime sayısı: ${content?.wordCount}`);
console.log(content?.html);
```

---

## 8. ÖNCELİK SIRASI

| # | İş | Dosya | Öncelik | Tahmini Efor |
|---|---|-------|---------|-------------|
| 1 | 75 il verisini ekle | `turkey-geo-data.ts` | 🔴 Kritik | Büyük |
| 2 | 8 içerik şablonu yaz | `content-templates.ts` | 🔴 Kritik | Büyük |
| 3 | Pipeline entegrasyonu | SEO stage handler | 🟡 Orta | Orta |
| 4 | Sitemap XML generator | `local-seo-generator.ts` | 🟡 Orta | Küçük |
| 5 | Nüfus verileri | `turkey-geo-data.ts` | 🟢 Düşük | Orta |
| 6 | Sektör bazlı sayfalar | Yeni dosya | 🟢 Düşük | Orta |

**Önerilen başlangıç**: Önce madde 1 (il verileri), sonra madde 2 (şablonlar). Bu ikisi tamamlanınca sistem çalışır duruma gelir.
