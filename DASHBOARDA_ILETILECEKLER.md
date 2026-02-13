# Dashboard'a Iletilecekler (Contract-First Entegrasyon Dosyasi)

## Amac
Dashboard ve `prosektorweb-builder` arasinda kontrat kopuklugu olmamasi icin uygulanmasi zorunlu teknik kurallar, endpoint kontratlari, CI kapilari ve release sirasini netlestirmek.

## Durum Ozeti
Builder tarafinda contract-first standartlari aktif:
- Contract surumu: `1.0`
- API envelope standardi: `{ success, version, ... }` ve hata icin `{ success:false, version, error, code }`
- Webhook envelope standardi: `{ ok, success, version, ... }` ve hata icin `{ ok:false, success:false, version, error, code }`

Kaynak dosyalar:
- `src/contracts/index.ts`
- `src/shared/lib/api-contract.ts`
- `src/features/site-engine/lib/publish-webhook.ts`
- `src/features/site-engine/lib/revalidate-handler.ts`
- `src/app/api/projects/*`

## Dashboard Tarafinda Zorunlu Uygulanacaklar

1. Tek Contract Surumu
- Dashboard, `@prosektor/contracts` paketini kullanmali.
- `CONTRACT_VERSION` degeri builder ile ayni olmali (`1.0`).
- Farkli contract version ile production deploy yapilmamali.

2. Versioned Payload ve Error Code Standardi
- Builder'a giden tum payloadlarda `version` alani bulunmali.
- Dashboard tarafinda da hata donusleri `error + code` seklinde normalize edilmeli.
- Ozellikle entegrasyon endpointlerinde serbest metin hatasi yerine kod bazli hata donulmeli.

3. Publish Webhook Kontrati (Dashboard -> Builder)
- Endpoint: `POST /api/internal/publish` (alias: `/api/revalidate`)
- Headerlar zorunlu:
  - `x-signature`
  - `x-timestamp`
  - `x-trace-id`
- Body zorunlu alanlar:
  - `version`: `"1.0"`
  - `event`: `publish | unpublish | page_update | site_update`
  - `traceId`: string (min 8)
  - `publishedAt`: ISO datetime
  - `site`: `{ id, slug, status }`
  - `pages`: string[]
  - `source`: string (`dashboard` onerilir)

Ornek body:
```json
{
  "version": "1.0",
  "event": "publish",
  "traceId": "evt_2026_02_x1",
  "publishedAt": "2026-02-10T20:00:00.000+03:00",
  "site": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "slug": "ornek-osgb",
    "status": "published"
  },
  "pages": ["/", "/hizmetler", "/iletisim"],
  "source": "dashboard"
}
```

4. Imza Uretimi (Zorunlu)
- Imza algoritmasi: HMAC SHA256
- Signed payload: `${timestamp}.${rawBody}`
- Prefix: `sha256=`
- Secret: `WEBHOOK_SECRET` (builder tarafinda dogrulaniyor)

5. Panel API Cevap Kontrati (Builder'in Dashboard'dan Beklentisi)
Builder su dashboard endpointlerini cagiriyor:
- `GET /api/me`
- `GET /api/sites`
- `GET /api/sites/:id`
- `GET /api/pages?site_id=:id`
- `GET /api/pages/:id/revisions`
- `GET /api/pages/:id/revisions/:revisionId`
- `GET /api/modules?site_id=:id`
- `GET /api/sites/:id/site-token`

Zorunlu uyumlar:
- Auth: `Authorization: Bearer <token>` desteklenmeli.
- Error body formati: `{ code, message, details? }`.
- Liste response formati tercihen sabit: `{ items: [...], total }`.
- Tip uyumu: `@prosektor/contracts` schema'lari ile parse edilebilir olmali.

## Builder Tarafi API Contract (Dashboard UI/Service Tuketimi Icin)
Builder'in project endpointleri artik versioned envelope donuyor:
- `GET/POST /api/projects`
- `GET/PATCH /api/projects/:id`
- `GET /api/projects/:id/pages`
- `POST /api/projects/:id/generate`
- `POST /api/projects/:id/publish`
- `GET /api/projects/:id/approvals`

Hata kodlari (ozellikle UI handling icin):
- `FORBIDDEN_FORCE_OVERRIDE`
- `AGENT_APPROVAL_TIMEOUT`
- `AGENT_APPROVAL_REJECTED`
- `PROJECT_GENERATE_FAILED`
- `PROJECT_PUBLISH_FAILED`
- `PROJECT_NOT_FOUND`
- `PROJECT_FETCH_FAILED`
- `PROJECT_UI_SETTINGS_MISSING`
- `PROJECT_UPDATE_FAILED`
- `INVALID_REQUEST`
- `PROJECTS_LIST_FAILED`
- `PROJECT_CREATE_FAILED`
- `PROJECT_PAGES_LIST_FAILED`
- `PROJECT_APPROVALS_LIST_FAILED`

Webhook tarafi hata kodlari:
- `WEBHOOK_SECRET_MISSING`
- `SIGNATURE_INVALID`
- `INVALID_JSON`
- `PAYLOAD_INVALID`
- `SITE_SLUG_INVALID`
- `TRACE_HEADER_REQUIRED`
- `TRACE_ID_MISMATCH`

## CI/CD Zorunlu Kapilar (Dashboard Repo)
1. Contract Parse Testleri
- `publishWebhookBodySchema` ile webhook body parse testi
- `apiErrorResponseSchema` ile dashboard hata response parse testi

2. Entegrasyon Smoke Test
- Akis: `create -> generate -> publish -> webhook -> revalidate`
- Approval reject/timeout senaryosu en az bir testte dogrulanmali

3. Deploy Gate
- Contract version mismatch varsa deploy fail
- Webhook signature test fail ise deploy fail

## Release Sirasi (Zorunlu)
1. `@prosektor/contracts` release
2. Dashboard release
3. Builder release

Ters sirada production deployment yapilmayacak.

## Izleme ve Alarm
Dashboard tarafinda asagidaki kodlar alarm kuralina baglanmali:
- `PAYLOAD_INVALID`
- `SIGNATURE_INVALID`
- `TRACE_ID_MISMATCH`
- `AGENT_APPROVAL_TIMEOUT`

Zorunlu log alanlari:
- `traceId`
- `siteSlug`
- `event`
- `version`
- `code` (hata varsa)

## Definition of Done (Dashboard)
- [ ] `@prosektor/contracts@1.0` ile uyumlu
- [ ] Webhook body `version` + signature dogru
- [ ] Error response formati `{ error, code }` standardinda
- [ ] CI'da contract parse testleri var ve yesil
- [ ] E2E publish hatti yesil
- [ ] Runtime alarm ve traceId korelasyonu aktif

## Not
Bu dokuman dashboard ekibine direkt handoff edilmek uzere hazirlanmistir. Uygulama sonrasi, dashboard ve builder birlikte staging ortaminda kontrat uyumluluk testi tekrar kosulmalidir.
