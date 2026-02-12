# Backend <-> Panel Integration Guide

Bu dokuman, panel ekibinin bu repodaki backend ile nasil entegre olacagini teknik ve karar-verilebilir seviyede tanimlar.

## 1) Scope ve Amaç

Bu repo panel uygulamasi degildir.
Bu repo:
- dis panel API'sinden site verisini okur,
- kendi `api/projects/*` endpointleri ile proje olusturma/uretim/yayin akisini yonetir,
- panel publish event'i geldiginde cache revalidate eder.

Ana referans dosyalar:
- `src/features/site-engine/lib/panel-client.ts`
- `src/features/projects/lib/project-layer.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/pages/route.ts`
- `src/app/api/projects/[id]/generate/route.ts`
- `src/app/api/projects/[id]/publish/route.ts`
- `src/features/site-engine/lib/revalidate-handler.ts`

## 2) Topoloji

1. Panel UI -> Panel API (`/sites`, `/pages`, `/modules`, `/public/*`).
2. Bu repo (`panel-client`) -> Panel API (JWT/Bearer ile).
3. Bu repo UI (`/projects/*`) -> Bu repo API (`/api/projects/*`).
4. Publish sonrasi panel -> Bu repo webhook (`POST /api/internal/publish` veya `/api/revalidate`).

## 3) Environment Contract

Zorunlu:

```env
DASHBOARD_API_HOST="https://dashboard.example.com"
WEBHOOK_SECRET="shared-secret-with-panel"
PANEL_API_TOKEN="<service-jwt-or-service-role-key>"
```

Fallback env:
- `PANEL_API_HOST`
- `DASHBOARD_PUBLIC_API_BASE`
- `PANEL_API_JWT`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_PUBLISH_SECRET`
- `DEMO_PUBLISH_WEBHOOK_SECRET`

Not:
- `panel-client` base URL'e otomatik `/api` suffix'i ekler.
- Ornek: `DASHBOARD_API_HOST=https://dashboard.example.com` -> hedef `https://dashboard.example.com/api/...`

## 4) Authentication Akisi (`panel-client`)

Token cozumleme sirasi:
1. Explicit token (`requestPanel(..., { token })`)
2. Incoming request `Authorization: Bearer ...`
3. Cookie: `sb-access-token`, `supabase-auth-token`
4. Isminde `auth-token` gecen diger cookie degerleri
5. Service env: `PANEL_API_TOKEN` -> `PANEL_API_JWT` -> `SUPABASE_SERVICE_ROLE_KEY`

`auth` modlari:
- `required` (default): token yoksa `401 UNAUTHORIZED` (PanelApiError)
- `optional`: token varsa gonderir
- `none`: token gondermez (public form proxy)

## 5) Panel API Endpoints (Bu repo tarafindan cagrilan)

`panel-client` tarafindan aktif kullanilan endpointler:
- `GET /me`
- `GET /sites`
- `POST /sites`
- `GET /sites/:id`
- `PATCH /sites/:id`
- `GET /pages?site_id=:siteId`
- `POST /pages`
- `PATCH /pages/:id`
- `GET /pages/:id/revisions`
- `GET /pages/:id/revisions/:revisionId`
- `POST /pages/:id/revisions`
- `GET /modules?site_id=:siteId`
- `GET /sites/:id/site-token`
- `POST /public/contact/submit`
- `POST /public/offer/submit`
- `POST /public/hr/apply`

Response toleransi:
- Tekil: `payload` veya `item` veya `data` veya `doc`
- Liste: `items` veya `docs` veya `data`
- Sozlesme validasyonu `@prosektor/contracts` ile yapilir

## 6) Bu Repo API Contract (Panel ekibinin tuketebilecegi)

### 6.1 `GET /api/projects`
Response:
```json
{
  "success": true,
  "projects": [
    {
      "id": "...",
      "name": "...",
      "description": "...",
      "template": "...",
      "industry": "...",
      "status": "DRAFT",
      "updatedAt": "2026-02-12T..."
    }
  ]
}
```

### 6.2 `POST /api/projects`
Body (`projectCreateSchema`):
```json
{
  "name": "Acme OSGB",
  "description": "Opsiyonel",
  "template": "corporate-clean",
  "industry": "OSGB",
  "contact": {
    "phone": "0212...",
    "email": "info@...",
    "address": "...",
    "city": "Istanbul",
    "district": "Kadikoy"
  }
}
```
Kurallar:
- `name`: zorunlu, min 3
- `description`: opsiyonel
- `slug` input olarak alinmaz; backend unique slug uretir

### 6.3 `GET /api/projects/:id`
Response:
```json
{
  "success": true,
  "project": {
    "id": "...",
    "name": "...",
    "slug": "...",
    "uiSettings": { ... }
  }
}
```

### 6.4 `PATCH /api/projects/:id`
Sadece `uiSettings` update eder.
Body:
```json
{
  "uiSettings": {
    "navigationLinks": [{ "label": "Ana Sayfa", "href": "/" }],
    "footerLinks": [{ "label": "Iletisim", "href": "/iletisim" }],
    "headerCtaLabel": "Teklif Al",
    "headerCtaHref": "/iletisim",
    "themeTokens": {
      "primaryColor": "#0f6ad7",
      "secondaryColor": "#0b4ca4",
      "accentColor": "#f59e0b",
      "backgroundColor": "#f6f8fb",
      "fontHeading": "Sora",
      "fontBody": "Manrope"
    },
    "layoutConfig": {
      "pages": {
        "/": {
          "sectionOrder": ["hero", "services", "about", "cta", "content"],
          "hiddenSections": ["faq"]
        }
      }
    },
    "sectionVariants": {
      "hero": "spotlight",
      "services": "list",
      "about": "card",
      "cta": "minimal",
      "contact": "compact"
    }
  }
}
```

### 6.5 `GET /api/projects/:id/pages`
Response:
```json
{
  "success": true,
  "pages": [
    {
      "id": "...",
      "name": "Ana Sayfa",
      "slug": "",
      "content": "<p>...</p>",
      "updatedAt": "2026-02-12T..."
    }
  ]
}
```

### 6.6 `POST /api/projects/:id/generate`
Body (`generationSchema`):
```json
{
  "companyName": "Acme OSGB",
  "description": "Is sagligi ve guvenligi...",
  "services": "Is Guvenligi Uzmanligi, Risk Degerlendirmesi",
  "phone": "0212...",
  "email": "info@...",
  "address": "..."
}
```
Response: `success + pages[]`

### 6.7 `POST /api/projects/:id/publish`
Body (opsiyonel):
```json
{
  "qaScore": 85,
  "escalationLevel": "low",
  "force": false,
  "minQaScore": 70,
  "requireQaScore": true
}
```
Response:
```json
{
  "success": true,
  "project": { ... },
  "pagesPublished": 4,
  "webhook": {
    "ok": true,
    "traceId": "..."
  },
  "qualityGate": {
    "qaScore": 85,
    "threshold": 70,
    "escalationLevel": "low",
    "forced": false
  }
}
```

## 7) `site.settings` Canonical Keys (Panel tarafi icin)

Panelin yazmasi onerilen canonical keyler:
- `navigation_links`
- `footer_links`
- `header_cta_label`
- `header_cta_href`
- `theme_tokens`
- `layout_config`
- `section_variants`

Legacy/alias keyler okunur ama update'te canonical keylere normalize edilir.

### 7.1 Layout ve Variant kurallari

Desteklenen sayfalar:
- `/`, `/hakkimizda`, `/hizmetler`, `/iletisim`, `/blog`

Desteklenen bolum tipleri:
- `hero`, `services`, `about`, `cta`, `contact`, `faq`, `team`, `stats`, `gallery`, `testimonials`, `content`

Izinli variant seti:
- `hero`: `default`, `spotlight`, `compact`
- `services`: `cards`, `list`, `compact`
- `about`: `default`, `card`
- `cta`: `banner`, `minimal`
- `contact`: `default`, `compact`

Renk tokenlari:
- HEX (`#RGB` veya `#RRGGBB`) olmali

## 8) Publish Webhook Contract (Panel -> Bu repo)

Endpoint:
- `POST /api/internal/publish`
- `POST /api/revalidate` (alias)

Header zorunlu:
- `x-signature`
- `x-timestamp`
- `x-trace-id`

Body (modern contract):
```json
{
  "event": "publish",
  "traceId": "evt_...",
  "publishedAt": "2026-02-12T20:00:00.000+03:00",
  "site": {
    "id": "uuid",
    "slug": "ornek-osgb",
    "status": "published"
  },
  "pages": ["/", "/hizmetler", "/iletisim"],
  "source": "panel"
}
```

Imza hesaplama:
- Digest string: `${x-timestamp}.${rawBody}`
- HMAC: sha256
- Header formati: `x-signature: sha256=<hex>`

Validasyon kurallari:
- signature + timestamp dogrulamasi
- max skew: 300s
- `x-trace-id` zorunlu ve body `traceId` ile ayni olmali
- replay engeli: Redis varsa Redis, yoksa memory fallback

Basarili cevap:
```json
{
  "ok": true,
  "traceId": "evt_...",
  "event": "publish",
  "siteSlug": "ornek-osgb",
  "revalidated": ["/ornek-osgb", "/ornek-osgb/hizmetler"],
  "warmed": [...],
  "warnings": []
}
```

## 9) Error Model

Bu repo API'leri genel olarak asagidaki formati dondurur:
```json
{ "success": false, "error": "..." }
```

Durum kodlari:
- `400`: validation veya business rule
- `401`: webhook imza hatasi / auth sorunu
- `404`: proje bulunamadi
- `500`: sunucu / config hatasi

Panel API kaynakli hatalar `PanelApiError` ile normalize edilir:
- `status`
- `code`
- `message`
- `details` (opsiyonel)

## 10) Panel Ekibi Uygulama Checklist

1. Panel API base URL'ini `/api` ile uyumlu olacak sekilde expose edin.
2. Service token veya user bearer token akisini netlestirin.
3. `site.settings` yaziminda canonical keyleri kullanin.
4. `POST /api/projects/:id/generate` icin `companyName` + `description` zorunlu alanlarini bos birakmayin.
5. Publish sonrasi webhook'u imzali gonderin (`x-signature`, `x-timestamp`, `x-trace-id`).
6. Webhook tekrar gonderimlerinde ayni `traceId` kullanmayin.
7. Hata ekraninda backend `error` mesajini son kullaniciya sadelestirilmis gosterecek mapping yapin.

## 11) Hızlı Smoke Test

```bash
# 1) Proje olustur
curl -X POST http://localhost:3001/api/projects \
  -H 'content-type: application/json' \
  -d '{"name":"Demo OSGB","description":"Ornek proje"}'

# 2) Icerik uret
curl -X POST http://localhost:3001/api/projects/<projectId>/generate \
  -H 'content-type: application/json' \
  -d '{"companyName":"Demo OSGB","description":"ISG hizmetleri"}'

# 3) Yayinla
curl -X POST http://localhost:3001/api/projects/<projectId>/publish \
  -H 'content-type: application/json' \
  -d '{}'
```

## 12) Related Docs

- `docs/panel/site-settings-ui.md`
- `README.md`
- `ops/artifacts/01-architecture.md`
- `ops/artifacts/04-backend-integration.md`
