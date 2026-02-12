# 2026-02 Reset Arşivi

Bu klasör, kod tabanını sadeleştirirken aktif geliştirmeden çıkarılan dosyaları içerir.

Arşive alınan başlıca bölümler:
- Eski panel/admin route'ları (`src/app/projects`, `src/app/portal`, `src/app/(payload)`)
- Panel odaklı API route'ları (`src/app/api/projects`, `src/app/api/portal`, `src/app/api/domains`)
- Dashboard entegrasyon katmanı (`src/features/dashboard`)
- Eski proje orchestration ve yardımcıları (`src/features/projects/actions`, `src/features/projects/components`, `src/features/projects/lib/*`)
- Yeni mimariye uymayan testler (`tests/domain-cutover.test.ts`, `tests/memory-backend.test.ts`, `tests/quality-gate.test.ts`)

Aktif çekirdek:
- Public site route'ları: `src/app/(sites)/[siteSlug]/*`
- Webhook endpoint'i: `src/app/api/internal/publish/route.ts`
- Form endpoint'leri: `src/app/api/contact`, `src/app/api/job-application`, `src/app/api/quote-request`
- Site data erişimi: `src/features/sites/lib/site-data.ts`
- Webhook imza yardımcıları: `src/features/site-engine/lib/publish-webhook.ts`
