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

# Dashboard'dan public site verisini cekmek icin (opsiyonel)
DASHBOARD_PUBLIC_API_BASE="http://localhost:3000"
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
