# ProSektor Builder - AI Website Generator

Bağımsız web sitesi oluşturma platformu.

## Kurulum

```bash
npm install
```

## Çalıştırma

```bash
npm run dev      # localhost:3001
npm run build    # Production build
npm run start    # Production server
```

## Environment Variables

`.env` dosyası oluşturun:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/prosektorbuilder"

# NextAuth
AUTH_SECRET="your-secret-key"

# OpenAI (AI Generation için)
OPENAI_API_KEY="sk-..."

# Dashboard Public API (runtime read)
DASHBOARD_PUBLIC_API_BASE="https://dashboard.prosektorweb.com"

# Dashboard Write API (create/update websites/pages)
# Boş bırakılırsa DASHBOARD_PUBLIC_API_BASE kullanılır
DASHBOARD_API_BASE="https://dashboard.prosektorweb.com"

# Dashboard host override (middleware rewrite bypass)
# Opsiyonel: set edilmezse DASHBOARD_PUBLIC_API_BASE / DASHBOARD_API_BASE host'u kullanilir
NEXT_PUBLIC_DASHBOARD_HOST="dashboard.prosektorweb.com"

# Dashboard API Token (Payload API access token)
DASHBOARD_API_TOKEN="your-dashboard-api-token"

# Demo sharing base URL (path-based)
DEMO_BASE_URL="https://demo.prosektorweb.com"
NEXT_PUBLIC_DEMO_BASE_URL="https://demo.prosektorweb.com"
NEXT_PUBLIC_DEMO_HOST="demo.prosektorweb.com"

# Dashboard collection mapping (opsiyonel)
DASHBOARD_SITES_COLLECTION="websites"
DASHBOARD_PAGES_COLLECTION="pages"
DASHBOARD_PAGE_SITE_FIELD="site"
```

## Yapı

```
src/
├── app/                # Next.js App Router
├── features/
│   ├── ai-generation/  # AI destekli içerik üretimi
│   └── projects/       # Proje yönetimi
├── components/         # UI bileşenleri
└── lib/                # Yardımcı fonksiyonlar
```
