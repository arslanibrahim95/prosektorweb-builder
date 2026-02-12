## Integration Summary
Bu entegrasyon, akışı tek bir durum makinesiyle sabitler: `draft -> generated -> published`.  
Uygulama sırası kesin olarak:

1. `create`: proje kaydı + ham content package hash’i yazılır.
2. `generate`: content package mevcut block/data model’e map edilip `page` ve `page_block` kayıtları idempotent upsert edilir.
3. `publish`: immutable `release` oluşturulur, publish webhook çağrılır, ardından revalidate doğrulanır.
4. Revalidate başarısızsa publish tamamlanmış sayılmaz; önceki aktif release korunur.

Bu planla publish doğruluğu, “webhook 2xx + revalidate tam eşleşme” şartına bağlanır.

## File-by-File Change List
| Dosya | Değişiklik |
|---|---|
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/api/project.routes.ts` | `POST /projects` ve `POST /projects/:projectId/generate` endpoint sözleşmelerini netleştir; durum geçiş kontrollerini route seviyesinde başlat. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/api/publish.routes.ts` | `POST /projects/:projectId/publish` ve `POST /webhooks/publish` endpointlerini tekil idempotency + imza doğrulama ile güncelle. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/services/project.service.ts` | Create akışında `contentHash`, `locale`, `slug` normalize et; proje durumunu başlangıçta `draft` set et. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/services/generate.service.ts` | Generate akışını transaction + row lock ile çalıştır; mapping sonrası `generatedAt`, `generatedHash`, `status=generated` yaz. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/services/publish.service.ts` | Publish’i 3 faza ayır: `release create` -> `webhook` -> `revalidate verify`; başarıda aktif release flip et, hatada rollback etmeden eski release’i koru. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/services/revalidate.service.ts` | Revalidate endpoint çağrısını imzalı yap; dönen `revalidatedPaths` listesini beklenen path set’iyle bire bir karşılaştır. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/mappers/content-package.mapper.ts` | Content package -> `page`/`page_block` map kurallarını tek noktada uygula; stable block key (`pageSlug:type:index`) üret. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/db/repositories/page-block.repository.ts` | Upsert anahtarını stable block key’e taşı; block sıralamasını `displayOrder` ile deterministik tut. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/server/validation/project.schemas.ts` | Create/generate/publish bodyData şemalarını katılaştır (slug, locale, section type enum, max length). |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/shared/contracts/project-api.contract.ts` | API request/response tiplerini runtime şemalarla hizala. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/src/shared/contracts/content-package.contract.ts` | Content package sözleşmesini (version, pages, sections, seo, navigation, theme) sabitle. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/.env.example` | `PUBLISH_WEBHOOK_SECRET`, `REVALIDATE_SECRET`, `FRONTEND_REVALIDATE_URL`, `WEBHOOK_TIMEOUT_MS` değişkenlerini ekle/açıkla. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/tests/unit/content-package.mapper.test.ts` | Mapping kuralları ve section-type dönüşümleri için unit test ekle. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/tests/unit/publish.service.test.ts` | Publish başarı/başarısızlık, idempotency ve release flip mantığını test et. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/tests/integration/project-flow.integration.test.ts` | `create -> generate -> publish` uçtan uca entegrasyon testi ekle. |
| `/home/igu/Desktop/osgb_site_yap/prosektorweb-builder/tests/integration/publish-webhook-revalidate.integration.test.ts` | Webhook imza doğrulama + revalidate eşleşme zorunluluğu için entegrasyon testi ekle. |

## API/Type Contract Updates
1. `POST /api/projects`
   - Request: `{ name, slug, locale, contentPackage, theme? }`
   - Response: `{ projectId, status: "draft", contentHash }`

2. `POST /api/projects/:projectId/generate`
   - Request: `{ force?: boolean }`
   - Response: `{ projectId, status: "generated", pagesCount, blocksCount, generatedHash }`
   - Kural: `force=false` ve hash aynıysa mevcut generated sonucu döndür (idempotent).

3. `POST /api/projects/:projectId/publish`
   - Header: `Idempotency-Key` zorunlu.
   - Request: `{ target: "preview" | "production" }`
   - Response: `{ releaseId, status: "published", publishedAt, revalidatedPaths }`

4. `POST /api/webhooks/publish`
   - Header: `x-signature`, `x-timestamp`, `x-webhook-id`
   - Body: `{ event: "project.published", projectId, releaseId, paths, tags }`
   - Kural: HMAC SHA-256 ve 5 dakika timestamp toleransı zorunlu.

5. Tip güncellemeleri
   - `ProjectStatus = "draft" | "generated" | "published" | "publish_failed"`
   - `SectionType` enum sabit: `hero | rich_text | features | gallery | faq | cta | contact | footer`
   - `PageBlock.data` yapısı section type’a göre discriminated union olacak.

## Data Mapping Rules (content package -> backend model)
| Content Package Alanı | Backend Model Alanı | Kural |
|---|---|---|
| `project.slug` | `project.slug` | Küçük harf + kebab-case normalize; benzersiz olmalı. |
| `project.locale` | `project.locale` | BCP-47 formatı zorunlu (`tr-TR`, `en-US` gibi). |
| `project.title` | `project.name` | Trim + max 120 karakter. |
| `theme` | `project.themeJson` | Şema doğrulaması sonrası JSON olarak saklanır. |
| `pages[].slug` | `page.slug` | Ana sayfa için `"/"`; diğerleri `"/{slug}"`. |
| `pages[].title` | `page.title` | Zorunlu, boş olamaz. |
| `pages[].seo` | `page.seoTitle`, `page.seoDescription` | Uzunluk limitleri: 70/160. |
| `pages[].sections[]` | `page_block` | Her section bir block; `displayOrder` dizin sırasından gelir. |
| `sections[i].type` | `page_block.type` | Enum map bire bir uygulanır; bilinmeyen type -> `422`. |
| `sections[i]` içerik alanları | `page_block.data` | Type’a özel şema ile doğrulanır; eksik zorunlu alan -> `422`. |
| `navigation.items` | `project_navigation` veya `project.settings.navigation` | Sıra korunur, URL relative değilse reddedilir. |
| `footer` | `project.settings.footer` | Link label/url çiftleri şema doğrulamasıyla saklanır. |

Ek deterministik kurallar:
1. Block anahtarı: `blockKey = "${pageSlug}:${sectionType}:${index}"`.
2. Generate sırasında aynı `blockKey` upsert edilir; silinen section’lar soft-delete edilir.
3. Publish sadece `generatedHash === latestContentHash` ise devam eder.

## Error Handling and Validation Rules
1. `400 Bad Request`: JSON parse hatası, zorunlu alan eksikliği.
2. `401 Unauthorized`: webhook/revalidate imza hatası.
3. `403 Forbidden`: timestamp penceresi dışında webhook.
4. `404 Not Found`: proje veya release bulunamadı.
5. `409 Conflict`: geçersiz durum geçişi (`draft` dışı generate, `generated` dışı publish) veya idempotency çakışması.
6. `422 Unprocessable Entity`: content mapping/section schema hatası.
7. `500 Internal Server Error`: beklenmeyen servis veya DB hatası.

Doğrulama kuralları:
1. `slug` regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
2. `pages[].slug` aynı proje içinde benzersiz.
3. Her sayfada en az 1 section olmalı.
4. `cta` section için `label` ve `href` zorunlu.
5. Publish tamamlanma koşulu: webhook 2xx + revalidate yanıtındaki path listesi beklenen set ile bire bir aynı.
6. Revalidate başarısızsa `project.status="publish_failed"` ve önceki aktif release aynen kalır.

## Test Plan (unit + integration)
1. Unit: `/tests/unit/content-package.mapper.test.ts`
   - Section type mapping, block key üretimi, sıralama, unknown type `422`.
2. Unit: `/tests/unit/project.schemas.test.ts`
   - Slug/locale/seo limitleri, invalid bodyData senaryoları.
3. Unit: `/tests/unit/publish.service.test.ts`
   - Durum geçişleri, idempotency-key tekrarları, release activation kuralları.
4. Unit: `/tests/unit/revalidate.service.test.ts`
   - İmza üretimi, timeout, path set mismatch.
5. Integration: `/tests/integration/project-flow.integration.test.ts`
   - `create -> generate -> publish` mutlu yol.
6. Integration: `/tests/integration/publish-webhook-revalidate.integration.test.ts`
   - Webhook signature fail, replay id (`x-webhook-id`) tekrar, revalidate eksik path.
7. Integration: `/tests/integration/publish-rollback.integration.test.ts`
   - Revalidate başarısızlığında eski aktif release’in korunması.

## Rollout/Verification Checklist
1. DB migration’ları uygula (`release`, `generatedHash`, `blockKey`, idempotency alanları).
2. `.env` değerlerini üretim/staging’de set et: `PUBLISH_WEBHOOK_SECRET`, `REVALIDATE_SECRET`, `FRONTEND_REVALIDATE_URL`, `WEBHOOK_TIMEOUT_MS`.
3. Contract testlerini CI’da zorunlu hale getir (özellikle `content-package.contract`).
4. Staging’de 3 senaryo smoke test çalıştır:
   - Başarılı create/generate/publish
   - Unknown section type ile generate reject
   - Revalidate fail ile publish başarısızlığı ve rollback doğrulaması
5. Publish sonrası doğrulama:
   - Aktif release ID değişti mi
   - Revalidated path listesi beklenenle bire bir aynı mı
   - Frontend’de yeni içerik cache’den değil güncel sürümden geliyor mu
6. İzleme/alert:
   - `publish_failed` oranı
   - webhook 4xx/5xx oranı
   - revalidate timeout oranı
7. Canlıya kademeli geçiş:
   - Önce tek proje, sonra %25, %100 publish trafiği.
   - Hata eşiği aşılırsa release flip’i durdur, generate açık kalsın.