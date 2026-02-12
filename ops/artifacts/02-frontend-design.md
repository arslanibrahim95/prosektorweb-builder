I will read the architecture artifact and `package.json` to ensure the frontend design aligns with the established system structure and technical stack.

# Frontend Tasarım Uygulama Rehberi

Bu rehber, OSGB Site Builder platformunun kurumsal kimliğini ve kullanıcı deneyimini standartlaştırmak için hazırlanmıştır. Mimari spesifikasyonda belirtilen "Modern-Kurumsal" çizgiyi temel alır.

## 1. Görsel Yönelim (Visual Direction)

ProsektorWeb Builder, profesyonel OSGB (Ortak Sağlık Güvenlik Birimi) hizmetlerini yansıtan, güven veren ve yüksek okunabilirlik sunan bir arayüz hedefler.

- **Theme Strategy:** Light-first with dark support.
- **Palette Rule: Neutral base + one primary accent.**
- **Motion Rule: Subtle, functional, and minimal.**
- **Component Consistency Rule: Keep components consistent across pages (same radius, border, shadow, and button logic).**

## 2. Tasarım Tokenları (CSS Variables)

Tüm bileşenlerde `tailwind.config.mjs` üzerinden yönetilen ve CSS değişkenleri ile desteklenen şu değerler kullanılacaktır:

### Renk Paleti (Colors)
| Token | Değer (Light) | Değer (Dark) | Kullanım Alanı |
| :--- | :--- | :--- | :--- |
| `--background` | `#FFFFFF` | `#09090B` | Ana arka plan |
| `--foreground` | `#020817` | `#F8FAFC` | Ana metin rengi |
| `--primary` | `#2563EB` | `#3B82F6` | Butonlar, linkler, vurgular |
| `--muted` | `#F1F5F9` | `#1E293B` | Pasif alanlar, alt metinler |
| `--accent` | `#F8FAFC` | `#27272A` | Hover durumları, yan panel |
| `--border` | `#E2E8F0` | `#27272A` | Kenarlıklar ve ayraçlar |

### Tipografi ve Spacing
- **Font Family:** Inter veya Sans-serif (Sistem fontları öncelikli).
- **Scale:** `0.875rem` (Base), `1.25rem` (H3), `1.875rem` (H1).
- **Radius:** `--radius: 0.5rem` (Tüm buton, kart ve inputlar için standart).
- **Spacing:** 4px katları (Tailwind default scale: `p-4`, `m-2`, `gap-6`).

## 3. Rota Bazlı UI Planı

### /projects (Proje Listesi)
- **Yapı:** Grid veya Liste görünümü.
- **UI Elemanları:** Statü filtreleri (Draft, Published, Error), arama barı, "Yeni Proje" butonu.
- **Davranış:** Kartların üzerinde projenin mevcut durumu belirgin bir Badge ile gösterilmelidir.

### /projects/new (Yeni Proje Oluşturma)
- **Yapı:** Temiz, tek sütun form veya adımlı (stepper) yapı.
- **UI Elemanları:** Şirket bilgileri inputları, sektör seçimi, tema ön seçimi.
- **Davranış:** Validasyon hataları anlık (inline) gösterilmeli.

### /projects/[id] (Proje Detay ve Kontrol Paneli)
- **Yapı:** İki sütunlu layout. Sol tarafta sayfa listesi ve ayarlar, sağ tarafta önizleme (iframe/preview).
- **UI Elemanları:** "Yayınla", "Yeniden Üret", "Düzenle" aksiyon butonları.
- **Davranış:** Proje statüsüne göre aksiyon butonları dinamik olarak aktif/pasif hale gelmeli.

### /projects/[id]/generate (Üretim Süreci)
- **Yapı:** Odaklanmış (minimalist) ekran.
- **UI Elemanları:** Progress bar, adım listesi (İçerik üretiliyor, Resimler optimize ediliyor...), işlem logları.
- **Davranış:** İşlem tamamlandığında otomatik olarak detay sayfasına yönlendirme.

### /(sites)/[siteSlug] (Runtime Sayfaları)
- **Yapı:** `BlockRenderer` tarafından işlenen dinamik bloklar.
- **UI Elemanları:** Seçilen temaya (Corporate, Modern vb.) uygun Header, Footer ve Sections.
- **Davranış:** Sayfa geçişleri `framer-motion` ile çok hafif (0.2s opacity) bir efektle yapılmalı.

## 4. Bileşen Eşleme (Component Mapping)

| Mevcut (shadcn/ui) | Gerekli Eklentiler / Özelleştirmeler |
| :--- | :--- |
| `Button` | Vurgu rengi `--primary` olarak set edilmeli, `lg` varyantı hero alanları için optimize edilmeli. |
| `Badge` | `ProjectStatus` tiplerine göre (Success, Warning, Destructive) renk eşleşmeleri yapılmalı. |
| `Card` | `hover:shadow-md` geçişi eklenmeli. |
| `Input` | `focus-visible:ring-primary` ile odaklanma vurgulanmalı. |
| **Yeni** | `StatusTimeline`: Üretim ve yayınlama aşamalarını gösteren dikey çizgi bileşeni. |
| **Yeni** | `ThemePreview`: Tema seçeneklerini görselleştiren küçük thumbnail bileşenleri. |

## 5. Responsive ve Erişilebilirlik Kuralları

- **Mobile First:** Tüm sayfalar 320px genişlikte kırılmadan çalışmalıdır.
- **Dokunma Hedefleri:** Mobil görünümde interaktif elemanlar en az 44px yükseklikte olmalıdır.
- **Kontrast:** Metin ve arka plan arasındaki kontrast oranı WCAG AA (4.5:1) standartlarını karşılamalıdır.
- **Focus State:** Klavye ile navigasyonda `focus-ring` her zaman görünür olmalıdır.

## 6. Backend Handoff Notları

- **Status Mapping:** UI, `ProjectStatus` enum değerlerine (draft, generating, review, etc.) tam uyumlu olmalıdır.
- **Puck Integration:** `/projects/[id]` sayfasındaki düzenleme modu Puck editörünün veri şeması (`puckData`) ile beslenmelidir.
- **Theme Config:** Tasarımda kullanılan `primaryColor` değişkeni, backend'den gelen `ThemeConfig` objesinden dinamik olarak beslenmeli (CSS Variables via Style Attribute).
- **API States:** Loading ve Error state'leri tüm fetch işlemlerinde UI tarafından yönetilmelidir (SWR veya React Query önerilir).
