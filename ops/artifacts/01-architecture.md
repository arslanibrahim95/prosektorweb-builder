# OSGB Site Engine - Mimari Spesifikasyonu

**Versiyon:** 1.0.0  
**Tarih:** 2026-02-12  
**Run ID:** 20260212-213847

---

## 1. Architecture Summary

OSGB Site Engine, Payload CMS + Puck editör yığınını kullanarak dinamik site oluşturma, içerik üretimi ve statik yayınlama akışı sağlayan bir sistemdir.

### Temel Mimari Prensipler

| Katman | Sorumluluk | Teknoloji |
|--------|-----------|-----------|
| **Data Layer** | Proje ve sayfa verileri | Payload CMS + MongoDB |
| **Generation Layer** | İçerik üretimi ve blok oluşturma | Server Actions |
| **Publishing Layer** | Statik site üretimi ve CDN dağıtımı | Cloudflare Pages |
| **Rendering Layer** | Dinamik site görüntüleme | Next.js App Router |
| **Revalidation Layer** | Cache invalidation ve ISR | Next.js Revalidation API |

### Akış Özeti

```
[Create] → [Generate] → [Publish] → [Revalidate] → [Serve]
   ↓           ↓            ↓            ↓           ↓
 Payload    AI/Manual    Cloudflare   Next.js    ISR/CDN
```

---

## 2. Module Boundaries

### 2.1 Core Modules

| Modül | Dosya Yolu | Sahiplik | Açıklama |
|-------|-----------|----------|----------|
| **Project Layer** | `src/features/projects/lib/project-layer.ts` | Backend | Proje CRUD işlemleri ve durum yönetimi |
| **Site Engine** | `src/features/site-engine/` | Backend | Üretim ve yayınlama orkestrasyonu |
| **Site Renderer** | `src/features/sites/` | Frontend | Blok render ve tema sistemi |
| **API Routes** | `src/app/api/projects/` | Backend | REST endpoint'leri |
| **Site Pages** | `src/app/(sites)/[siteSlug]/` | Frontend | Dinamik site sayfaları |

### 2.2 Dosya Sahipliği Matrisi

```
src/
├── app/
│   ├── api/
│   │   ├── projects/
│   │   │   ├── route.ts                    [Backend] - Proje listesi ve oluşturma
│   │   │   └── [id]/
│   │   │       ├── route.ts                [Backend] - Proje detay/güncelleme/silme
│   │   │       ├── generate/
│   │   │       │   └── route.ts            [Backend] - İçerik üretimi tetikleme
│   │   │       └── publish/
│   │   │           └── route.ts            [Backend] - Yayınlama tetikleme
│   │   ├── revalidate/
│   │   │   └── route.ts                    [Backend] - Cache invalidation
│   │   ├── internal/                       [Backend] - Dahili servisler
│   │   └── public/                         [Backend] - Public API'ler
│   ├── (sites)/
│   │   └── [siteSlug]/
│   │       ├── layout.tsx                  [Frontend] - Site layout ve tema
│   │       ├── page.tsx                    [Frontend] - Ana sayfa
│   │       ├── [pageSlug]/
│   │       │   └── page.tsx                [Frontend] - Dinamik sayfalar
│   │       ├── blog/
│   │       │   └── [postSlug]/
│   │       │       └── page.tsx            [Frontend] - Blog detay
│   │       └── iletisim/
│   │           └── page.tsx                [Frontend] - İletişim sayfası
│   └── projects/
│       ├── page.tsx                        [Frontend] - Proje listesi (Admin)
│       └── [id]/
│           └── page.tsx                    [Frontend] - Proje detay (Admin)
├── features/
│   ├── projects/
│   │   └── lib/
│   │       └── project-layer.ts            [Backend] - Proje iş mantığı
│   ├── site-engine/
│   │   └── lib/
│   │       ├── revalidate-handler.ts       [Backend] - Revalidation mantığı
│   │       ├── content-generator.ts        [Backend] - İçerik üretimi
│   │       └── publish-handler.ts          [Backend] - Yayınlama mantığı
│   └── sites/
│       ├── components/
│       │   ├── BlockRenderer.tsx           [Frontend] - Blok render sistemi
│       │   ├── layout/
│       │   │   ├── ThemedSiteHeader.tsx    [Frontend] - Site header
│       │   │   └── ThemedSiteFooter.tsx    [Frontend] - Site footer
│       │   └── sections/
│       │       ├── HeroSection.tsx         [Frontend] - Hero blok
│       │       ├── AboutSection.tsx        [Frontend] - Hakkında blok
│       │       ├── ContactSection.tsx      [Frontend] - İletişim blok
│       │       └── ContentBlock.tsx        [Frontend] - Genel içerik blok
│       └── lib/
│           └── site-data.ts                [Backend] - Site veri çekme
├── collections/
│   ├── Pages.ts                            [Backend] - Payload Pages collection
│   └── access.ts                           [Backend] - Erişim kontrolleri
└── contracts/                              [Shared] - TypeScript arayüzleri
```

---

## 3. Public API and Contract Table

### 3.1 REST Endpoints

| Endpoint | Method | Payload | Response | Durum |
|----------|--------|---------|----------|-------|
| `/api/projects` | GET | - | `ProjectListResponse` | ✅ Aktif |
| `/api/projects` | POST | `CreateProjectPayload` | `Project` | ✅ Aktif |
| `/api/projects/[id]` | GET | - | `Project` | ✅ Aktif |
| `/api/projects/[id]` | PATCH | `UpdateProjectPayload` | `Project` | ✅ Aktif |
| `/api/projects/[id]` | DELETE | - | `{ success: boolean }` | ✅ Aktif |
| `/api/projects/[id]/generate` | POST | `GenerateContentPayload` | `GenerationResult` | ✅ Aktif |
| `/api/projects/[id]/publish` | POST | `PublishPayload` | `PublishResult` | ✅ Aktif |
| `/api/revalidate` | POST | `RevalidatePayload` | `{ revalidated: boolean }` | ✅ Aktif |
| `/api/contact` | POST | `ContactFormPayload` | `{ success: boolean }` | ✅ Aktif |
| `/api/job-application` | POST | `JobApplicationPayload` | `{ success: boolean }` | ✅ Aktif |
| `/api/quote-request` | POST | `QuoteRequestPayload` | `{ success: boolean }` | ✅ Aktif |

### 3.2 Contract Definitions

```typescript
// src/contracts/project.ts

interface Project {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  status: ProjectStatus;
  theme: ThemeConfig;
  pages: Page[];
  seoConfig: SEOConfig;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

type ProjectStatus = 
  | 'draft'
  | 'generating'
  | 'review'
  | 'approved'
  | 'publishing'
  | 'published'
  | 'error';

interface ThemeConfig {
  variant: 'corporate' | 'modern' | 'minimal' | 'bold';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
}

interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

// src/contracts/generation.ts

interface CreateProjectPayload {
  name: string;
  slug: string;
  companyInfo: CompanyInfo;
  services: string[];
  theme?: Partial<ThemeConfig>;
}

interface GenerateContentPayload {
  regeneratePages?: string[];  // boş ise tüm sayfalar
  seoOptimize?: boolean;
  contentTone?: 'professional' | 'friendly' | 'formal';
}

interface GenerationResult {
  success: boolean;
  pagesGenerated: number;
  errors?: GenerationError[];
  warnings?: string[];
}

// src/contracts/publish.ts

interface PublishPayload {
  environment: 'preview' | 'production';
  customDomain?: string;
  purgeCache?: boolean;
}

interface PublishResult {
  success: boolean;
  deploymentId: string;
  url: string;
  cdnUrls?: string[];
  publishedAt: Date;
}

// src/contracts/revalidate.ts

interface RevalidatePayload {
  projectId: string;
  paths?: string[];      // boş ise tüm site
  tags?: string[];       // tag-based revalidation
  secret: string;        // REVALIDATION_SECRET
}
```

### 3.3 Payload CMS Collections

| Collection | Slug | Alanlar | İlişkiler |
|------------|------|---------|-----------|
| **Projects** | `projects` | id, name, slug, status, theme, seoConfig, publishedAt | pages (hasMany) |
| **Pages** | `pages` | id, title, slug, puckData, seo, status | project (belongsTo) |
| **Media** | `media` | id, url, alt, mimeType | - |
| **BlogPosts** | `blog-posts` | id, title, slug, content, excerpt, publishedAt | project, author |

---

## 4. Data Flow

### 4.1 Create Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CREATE FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Admin UI]                                                         │
│      │                                                              │
│      ▼                                                              │
│  POST /api/projects                                                 │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ project-layer.ts::createProject()                             │  │
│  │  1. Validate payload (Zod)                                    │  │
│  │  2. Generate unique slug                                      │  │
│  │  3. Create Payload document                                   │  │
│  │  4. Initialize default pages structure                        │  │
│  │  5. Set status = 'draft'                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ▼                                                              │
│  [Payload CMS] → MongoDB                                           │
│      │                                                              │
│      ▼                                                              │
│  Response: Project { id, slug, status: 'draft' }                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Generate Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GENERATE FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Admin UI / Trigger]                                               │
│      │                                                              │
│      ▼                                                              │
│  POST /api/projects/[id]/generate                                  │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ site-engine/lib/content-generator.ts                          │  │
│  │  1. Update status = 'generating'                              │  │
│  │  2. Load project context (company info, services)             │  │
│  │  3. For each page template:                                   │  │
│  │     a. Generate Puck blocks via AI/templates                  │  │
│  │     b. Optimize SEO metadata                                  │  │
│  │     c. Save puckData to Pages collection                      │  │
│  │  4. Validate generated content                                │  │
│  │  5. Update status = 'review'                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ▼                                                              │
│  [Payload CMS] → Pages updated with puckData                       │
│      │                                                              │
│      ▼                                                              │
│  Response: GenerationResult { success, pagesGenerated }            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Puck Data Structure:**

```typescript
interface PuckData {
  root: {
    props: RootProps;
  };
  content: PuckBlock[];
  zones?: Record<string, PuckBlock[]>;
}

interface PuckBlock {
  type: string;          // 'HeroSection' | 'AboutSection' | ...
  props: BlockProps;
}
```

### 4.3 Publish Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PUBLISH FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Admin Approval]                                                   │
│      │                                                              │
│      ▼                                                              │
│  POST /api/projects/[id]/publish                                   │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ site-engine/lib/publish-handler.ts                            │  │
│  │  1. Update status = 'publishing'                              │  │
│  │  2. Validate all pages are ready                              │  │
│  │  3. Generate static assets (if needed)                        │  │
│  │  4. Deploy to Cloudflare Pages:                               │  │
│  │     a. Create deployment                                      │  │
│  │     b. Upload assets                                          │  │
│  │     c. Configure custom domain (optional)                     │  │
│  │  5. Trigger ISR revalidation                                  │  │
│  │  6. Update status = 'published', set publishedAt              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ├───────────────────┬───────────────────┐                     │
│      ▼                   ▼                   ▼                     │
│  [Cloudflare]     [Next.js ISR]      [Payload Update]             │
│      │                   │                   │                     │
│      ▼                   ▼                   ▼                     │
│  CDN Edge         Cache Purge         publishedAt set              │
│                                                                     │
│  Response: PublishResult { deploymentId, url }                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 Revalidate Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REVALIDATE FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Webhook / Manual Trigger]                                         │
│      │                                                              │
│      ▼                                                              │
│  POST /api/revalidate                                              │
│  Headers: { x-revalidate-secret: REVALIDATION_SECRET }             │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ site-engine/lib/revalidate-handler.ts                         │  │
│  │  1. Validate secret                                           │  │
│  │  2. Parse paths/tags from payload                             │  │
│  │  3. Execute revalidation strategy:                            │  │
│  │     - revalidatePath() for specific paths                     │  │
│  │     - revalidateTag() for tag-based invalidation              │  │
│  │  4. Log revalidation event                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ▼                                                              │
│  [Next.js Cache] → Invalidated                                     │
│      │                                                              │
│      ▼                                                              │
│  Response: { revalidated: true, paths: [...] }                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Site Rendering Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SITE RENDERING FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [User Request]                                                     │
│  GET /[siteSlug]/[pageSlug]                                        │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ middleware.ts                                                 │  │
│  │  1. Match hostname/path to project                            │  │
│  │  2. Rewrite to (sites) route group                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ (sites)/[siteSlug]/layout.tsx                                 │  │
│  │  1. Load project data via site-data.ts                        │  │
│  │  2. Apply theme configuration                                 │  │
│  │  3. Render ThemedSiteHeader/Footer                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ (sites)/[siteSlug]/[pageSlug]/page.tsx                        │  │
│  │  1. Load page puckData                                        │  │
│  │  2. Pass to BlockRenderer                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ BlockRenderer.tsx                                             │  │
│  │  1. Map block types to components                             │  │
│  │  2. Render each block with props                              │  │
│  │  3. Apply theme-aware styling                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│      │                                                              │
│      ▼                                                              │
│  [HTML Response] (ISR cached)                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Failure Modes and Mitigations

| Hata Senaryosu | Tespit Mekanizması | Mitigasyon | Recovery |
|----------------|-------------------|------------|----------|
| **Generation Timeout** | 60s timeout | Chunk-based generation, progress tracking | Partial save, retry from checkpoint |
| **Publish Deployment Fail** | Cloudflare API error | Retry with exponential backoff (3 attempts) | Rollback to previous deployment |
| **Revalidation Fail** | revalidate() throws | Log error, continue with stale cache | Manual revalidation endpoint |
| **Database Connection Lost** | Payload connection error | Connection pooling, auto-reconnect | Circuit breaker, fallback to cached data |
| **Invalid Puck Data** | Runtime render error | Schema validation before save | Display fallback component, log error |
| **Theme Config Invalid** | Zod validation fail | Default theme fallback | Show validation errors in admin |
| **Cloudflare API Rate Limit** | 429 response | Queue-based deployment, rate limiting | Exponential backoff, queue persistence |
| **Memory Exhaustion (Generation)** | Process OOM | Stream-based processing, worker isolation | Auto-restart, reduce batch size |

### Error Handling Strategy

```typescript
// src/features/site-engine/lib/error-handler.ts

enum ErrorCode {
  GENERATION_TIMEOUT = 'E001',
  GENERATION_FAILED = 'E002',
  PUBLISH_FAILED = 'E003',
  REVALIDATION_FAILED = 'E004',
  DATABASE_ERROR = 'E005',
  VALIDATION_ERROR = 'E006',
  CLOUDFLARE_ERROR = 'E007',
}

interface EngineError {
  code: ErrorCode;
  message: string;
  context?: Record<string, unknown>;
  retryable: boolean;
  timestamp: Date;
}

// Status transitions on error
const ERROR_STATUS_MAP: Record<ProjectStatus, ProjectStatus> = {
  'generating': 'draft',      // rollback
  'publishing': 'approved',   // rollback
  // others remain unchanged
};
```

---

## 6. Backend Integration Tasks (for Codex CLI)

### Öncelik 1: Kritik Altyapı

| Task ID | Açıklama | Dosya | Bağımlılık |
|---------|----------|-------|------------|
| **BE-001** | Project CRUD endpoint'lerini tamamla | `src/app/api/projects/route.ts` | - |
| **BE-002** | Proje durum makinesi implement et | `src/features/projects/lib/project-layer.ts` | BE-001 |
| **BE-003** | Generate endpoint ve content-generator entegrasyonu | `src/app/api/projects/[id]/generate/route.ts` | BE-002 |
| **BE-004** | Puck data validasyonu ve dönüşümü | `src/features/site-engine/lib/puck-validator.ts` | BE-003 |

### Öncelik 2: Yayınlama Sistemi

| Task ID | Açıklama | Dosya | Bağımlılık |
|---------|----------|-------|------------|
| **BE-005** | Publish endpoint ve Cloudflare entegrasyonu | `src/app/api/projects/[id]/publish/route.ts` | BE-004 |
| **BE-006** | Cloudflare Pages deployment handler | `src/server/integrations/cloudflare.ts` | BE-005 |
| **BE-007** | Revalidation handler implementation | `src/features/site-engine/lib/revalidate-handler.ts` | BE-005 |
| **BE-008** | Webhook endpoint for Payload hooks | `src/app/api/internal/webhook/route.ts` | BE-007 |

### Öncelik 3: Veri Katmanı

| Task ID | Açıklama | Dosya | Bağımlılık |
|---------|----------|-------|------------|
| **BE-009** | Pages collection Puck field eklentisi | `src/collections/Pages.ts` | - |
| **BE-010** | Site data fetcher optimizasyonu | `src/features/sites/lib/site-data.ts` | BE-009 |
| **BE-011** | Access control politikaları | `src/collections/access.ts` | BE-009 |
| **BE-012** | Contract type definitions | `src/contracts/` | - |

### Öncelik 4: Form İşleme

| Task ID | Açıklama | Dosya | Bağımlılık |
|---------|----------|-------|------------|
| **BE-013** | Contact form handler | `src/app/api/contact/route.ts` | - |
| **BE-014** | Job application handler | `src/app/api/job-application/route.ts` | - |
| **BE-015** | Quote request handler | `src/app/api/quote-request/route.ts` | - |

---

## 7. Frontend Constraints (for Gemini CLI)

### Temel Kurallar

1. **Sadece `src/features/sites/` ve `src/app/(sites)/` dizinlerinde çalış**
2. **Backend API'lerini değiştirme** - contract'lara uy
3. **Server Components öncelikli** - Client Components sadece interaktivite için
4. **Tema sistemi zorunlu** - ThemeConfig'e bağlı kal

### Component Hiyerarşisi

```
ThemedSiteLayout (Server)
├── ThemedSiteHeader (Server)
├── BlockRenderer (Server)
│   ├── HeroSection (Server/Client hybrid)
│   ├── AboutSection (Server)
│   ├── ContactSection (Client - form)
│   ├── ContentBlock (Server)
│   └── [Custom Blocks]
└── ThemedSiteFooter (Server)
```

### Frontend Tasks

| Task ID | Açıklama | Dosya | Kısıtlamalar |
|---------|----------|-------|--------------|
| **FE-001** | BlockRenderer type-safe mapping | `src/features/sites/components/BlockRenderer.tsx` | Puck block types ile eşleşmeli |
| **FE-002** | HeroSection tema varyantları | `src/features/sites/components/sections/HeroSection.tsx` | 4 tema varyantı desteklemeli |
| **FE-003** | AboutSection responsive layout | `src/features/sites/components/sections/AboutSection.tsx` | Mobile-first |
| **FE-004** | ContactSection form integration | `src/features/sites/components/sections/ContactSection.tsx` | `/api/contact` kullanmalı |
| **FE-005** | ThemedSiteHeader navigation | `src/features/sites/components/layout/ThemedSiteHeader.tsx` | Pages collection'dan menü |
| **FE-006** | ThemedSiteFooter links | `src/features/sites/components/layout/ThemedSiteFooter.tsx` | Dinamik link yapısı |
| **FE-007** | Blog post page | `src/app/(sites)/[siteSlug]/blog/[postSlug]/page.tsx` | ISR ile cache |
| **FE-008** | İletişim page form | `src/app/(sites)/[siteSlug]/iletisim/page.tsx` | Client-side validation |

### Tema Sistemi Kullanımı

```typescript
// Frontend components MUST use theme from context
import { useTheme } from '@/features/sites/lib/theme-context';

// OR for server components, receive as prop
interface ThemedProps {
  theme: ThemeConfig;
}

// Color application
const styles = {
  primaryBg: `bg-[${theme.primaryColor}]`,
  secondaryText: `text-[${theme.secondaryColor}]`,
};
```

### Forbidden Patterns

- ❌ Direct database access from components
- ❌ Hardcoded colors (use theme system)
- ❌ `use client` without clear justification
- ❌ Modifying files outside `src/features/sites/` or `src/app/(sites)/`
- ❌ Creating new API routes
- ❌ Installing new dependencies

---

## 8. Acceptance Checklist

### Backend Kabul Kriterleri

- [ ] **BE-AC-01**: `POST /api/projects` yeni proje oluşturur, status='draft' döner
- [ ] **BE-AC-02**: `POST /api/projects/[id]/generate` puckData üretir, status='review' olur
- [ ] **BE-AC-03**: `POST /api/projects/[id]/publish` Cloudflare'e deploy eder, URL döner
- [ ] **BE-AC-04**: `POST /api/revalidate` belirtilen path'leri invalidate eder
- [ ] **BE-AC-05**: Tüm endpoint'ler Zod validation kullanır
- [ ] **BE-AC-06**: Error durumlarında uygun status rollback yapılır
- [ ] **BE-AC-07**: Cloudflare entegrasyonu retry logic içerir

### Frontend Kabul Kriterleri

- [ ] **FE-AC-01**: BlockRenderer tüm block type'ları render eder
- [ ] **FE-AC-02**: Tüm section'lar 4 tema varyantını destekler
- [ ] **FE-AC-03**: Mobile responsive (320px - 1920px)
- [ ] **FE-AC-04**: Contact form başarılı submit yapar, feedback gösterir
- [ ] **FE-AC-05**: Lighthouse Performance skoru > 90
- [ ] **FE-AC-06**: Lighthouse Accessibility skoru > 95
- [ ] **FE-AC-07**: ISR doğru çalışır (revalidation sonrası içerik güncellenir)

### Integration Kabul Kriterleri

- [ ] **INT-AC-01**: Create → Generate → Publish → Serve akışı end-to-end çalışır
- [ ] **INT-AC-02**: Payload hook'ları revalidation tetikler
- [ ] **INT-AC-03**: Custom domain'ler doğru resolve olur
- [ ] **INT-AC-04**: Error state'lerde kullanıcıya anlamlı mesaj gösterilir

### Test Coverage

- [ ] **TEST-01**: Unit tests for project-layer.ts (>80% coverage)
- [ ] **TEST-02**: Integration tests for API routes
- [ ] **TEST-03**: E2E test for full publish flow
- [ ] **TEST-04**: Component tests for BlockRenderer and sections

---

## Appendix A: Environment Variables

```bash
# Required
DATABASE_URI=mongodb://...
PAYLOAD_SECRET=xxx
NEXT_PUBLIC_SITE_URL=https://...
REVALIDATION_SECRET=xxx
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ACCOUNT_ID=xxx

# Optional
OPENAI_API_KEY=xxx              # AI generation
SENTRY_DSN=xxx                  # Error tracking
```

## Appendix B: Status State Machine

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│   draft ──────────► generating ──────────► review            │
│     ▲                   │                    │               │
│     │                   │ (error)            │               │
│     └───────────────────┘                    │               │
│                                              ▼               │
│                                           approved           │
│                                              │               │
│                                              ▼               │
│   error ◄─────────── publishing ─────────► published        │
│     │                                        │               │
│     └────────────────────────────────────────┘               │
│                   (re-publish)                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

*Bu doküman, OSGB Site Engine'in kaynak-gerçeği (source-of-truth) olarak işlev görür. Tüm implementasyon kararları bu spesifikasyona uygun olmalıdır.*
