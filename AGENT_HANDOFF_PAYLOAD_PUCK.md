# TASK: OSGB Site Yap - Payload/Puck Uyumlaştırma

## Goal
`osgb_site_yap` runtime'ını `dashboard` (Payload + Puck) ile tam uyumlu hale getir ve kullanıcıya tek sistem hissi ver.

## Source of Truth
- İçerik kaynağı: `dashboard` Payload koleksiyonları
  - `websites`
  - `pages`
  - `site-settings`
- Edit/publish yalnızca `dashboard/admin/builder` üzerinden yapılır.

## Required Contracts
- Page content alanı: `pages.puckData`
- Desteklenen block tipleri:
  - `hero`, `services`, `about`, `cta`, `faq`, `team`, `stats`, `gallery`, `testimonials`, `content`
- Public API:
  - `GET /api/public/sites/:siteSlug/pages`
  - `GET /api/public/sites/:siteSlug/pages/:pageSlug`
- Public API yalnızca `published` içerik döndürür.

## Implementation Steps
1. Response contract guard ekle:
   - `site`, `settings`, `pages/page` için runtime doğrulama (Zod veya TS guard).
2. Adapter katmanı netleştir:
   - `puckData.content` -> mevcut section component prop yapısına map et.
   - Eksik alanlar için güvenli fallback uygula.
3. Tasarım dili birleştir:
   - API'den gelen `brandPrimary/brandSecondary` ve font tercihlerini layout CSS variable olarak uygula.
4. Güvenlik kuralları:
   - Draft içeriğin public runtime'a sızmamasını garanti et.
   - Hata modelini standart JSON (`{ ok:false, error }`) formatında tut.
5. Yayın akışını doğrula:
   - Save = draft
   - Publish = `status=published` + deployment queue tetikleme (dashboard tarafı).

## Environment Requirements
- `prosektorweb-builder/.env`:
  - `DASHBOARD_PUBLIC_API_BASE="http://localhost:3000"` (veya prod dashboard URL)

## Acceptance Criteria
1. Bilinmeyen site/page için `404` JSON döner.
2. Published page runtime'da doğru render edilir.
3. Draft içerik public tarafta görünmez.
4. Tema tokenları (renk/font) sayfaya uygulanır.
5. Save/publish endpointleri yetkisiz isteklerde `401/403` döner.
6. Build her iki repoda da başarılıdır.

## Test Checklist (Minimum)
- `pnpm -C /home/igu/Desktop/dashboard build`
- `npm -C /home/igu/Desktop/osgb_site_yap/prosektorweb-builder run build` (veya mevcut projede kullanılan doğrulama komutu)
- `curl` ile:
  - `/api/public/sites/nonexistent/pages` -> 404
  - valid site + valid page -> 200 + `ok:true`

## Output Format (Agent Response)
1. Değişen dosyalar listesi
2. API contract özeti
3. Test komutları ve PASS/FAIL sonuçları
4. Bilinen riskler ve takip işleri
