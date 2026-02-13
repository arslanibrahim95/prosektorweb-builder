# OSGB Site Engine

Bu repo artık panel/editör uygulaması değildir.  
Amaç: dış panelde düzenlenen OSGB içeriklerini canlıda render etmek ve publish webhook ile cache yenilemektir.

## Aktif Mimari

- Public site route: `src/app/(sites)/[siteSlug]/*`
- Site veri katmanı: `src/features/sites/lib/site-data.ts` (Panel API + JWT)
- Proje olusturma akisi:
  - `GET/POST /api/projects`
  - `GET /api/projects/:id`
  - `POST /api/projects/:id/generate`
  - `GET /api/projects/:id/pages`
  - `POST /api/projects/:id/publish`
  - `GET /api/projects/:id/approvals`
  - UI: `src/app/projects/*`
- Publish webhook endpoint'leri:
  - `POST /api/internal/publish`
  - `POST /api/revalidate` (alias)
- Public form endpoint'leri:
  - `POST /api/public/contact/submit`
  - `POST /api/public/offer/submit`
  - `POST /api/public/hr/apply`
- Legacy uyumluluk endpoint'leri:
  - `POST /api/contact`
  - `POST /api/quote-request`
  - `POST /api/job-application`

Eski panel/proje yönetimi kodları arşive taşındı:
- `legacy/2026-02-reset/`

## Geliştirme

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3001` üzerinde çalışır.

## Environment Variables

Minimum:

```env
DASHBOARD_API_HOST="https://dashboard.example.com"
WEBHOOK_SECRET="shared-secret-with-panel"
PANEL_API_TOKEN="<service-jwt-or-service-role-key>"
```

Geriye dönük uyumluluk:
- `INTERNAL_PUBLISH_SECRET` ve `DEMO_PUBLISH_WEBHOOK_SECRET` de kabul edilir.
- `PANEL_API_HOST`, `DASHBOARD_PUBLIC_API_BASE` fallback olarak okunur.

Opsiyonel warmup/replay ayarları:

```env
DEMO_WARMUP_TIMEOUT_MS="6000"
DEMO_WARMUP_RETRY_COUNT="3"
DEMO_WARMUP_RETRY_BACKOFF_MS="200"

DEMO_REPLAY_REDIS_REST_URL="https://<redis-rest-endpoint>"
DEMO_REPLAY_REDIS_REST_TOKEN="<redis-rest-token>"
DEMO_REPLAY_REDIS_KEY_PREFIX="demo:publish:replay"
```

AI approval (generate + publish gate) ayarları:

```env
AGENT_APPROVAL_MODE="auto"         # auto | mock | openai
AGENT_APPROVAL_OPENAI_MODEL="gpt-4.1-mini"
AGENT_APPROVAL_REQUIRED_VOTES="3"
AGENT_APPROVAL_MIN_SCORE="80"
AGENT_APPROVAL_TIMEOUT_MS="20000"
OPENAI_API_KEY="sk-..."
```

## Panelden UI Yonetimi

Panel `site.settings` alanindan nav ve yerlesim linkleri de yonetilebilir.

Desteklenen anahtarlar:
- `navigation_links` / `navigationLinks` / `nav_links`: Header menu link listesi
- `footer_links` / `footerLinks`: Footer hizli link listesi
- `header_cta_label` / `headerCtaLabel`: Header CTA metni
- `header_cta_href` / `headerCtaHref`: Header CTA hedefi

Link ogesi formati:

```json
{
  "label": "Hizmetler",
  "href": "/hizmetler"
}
```

Notlar:
- `href: ""` veya `href: "/"` ana sayfayi temsil eder.
- `https://...` degerleri dis link olarak oldugu gibi kullanilir.
- Footer linkleri verilmezse header linkleri fallback olarak kullanilir.

Detayli panel duzenleme dokumani:
- `docs/panel/site-settings-ui.md`
- `docs/panel/backend-panel-integration.md`

## Publish Webhook Kontratı

Endpoint: `POST /api/internal/publish` veya `POST /api/revalidate`

Header'lar:
- `x-signature`
- `x-timestamp`
- `x-trace-id`

BodyData:

```json
{
  "event": "publish",
  "traceId": "evt_2026_02_x1",
  "publishedAt": "2026-02-10T20:00:00.000+03:00",
  "site": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "slug": "ornek-osgb",
    "status": "published"
  },
  "pages": ["/", "/hizmetler", "/iletisim"],
  "source": "panel"
}
```

Başarılı çağrıda ilgili yollar `revalidatePath` ile yenilenir ve warmup istekleri atılır.

Legacy bodyData (`siteSlug` alanı direkt body'de) da geçiş dönemi için desteklenir.

## Contracts

Kod tarafında `@prosektor/contracts` import adı kullanılır. Bu repoda geçici local path map ile çözülür:
- `src/contracts/index.ts`
- `tsconfig.json` içinde `@prosektor/contracts` path tanımı

## Test ve Doğrulama

```bash
npm run typecheck
npm run test
```

Not: Bu reset sonrası test kapsamı yalnızca aktif çekirdeğe odaklıdır.
