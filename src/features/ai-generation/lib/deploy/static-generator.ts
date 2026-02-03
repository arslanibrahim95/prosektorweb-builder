/**
 * Static Site Generator
 * Onaylanan AI içeriklerinden statik HTML sitesi oluşturur
 */

import { prisma } from '@/server/db';
import type { GeneratedContent, WebProject, Company } from '@prisma/client';
import { sanitizeHtml } from '@/shared/lib/sanitize';

// ================================
// TYPES
// ================================

interface SiteData {
    project: WebProject & { company: Company };
    contents: Map<string, GeneratedContent>;
    domain: string;
}

interface GeneratedPage {
    filename: string;
    title: string;
    content: string;
    meta: {
        title: string;
        description: string;
    };
}

// Helper to escape HTML entities for meta tags
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================================
// HTML TEMPLATES
// ================================

const BASE_TEMPLATE = (
    title: string,
    metaTitle: string,
    metaDescription: string,
    content: string, // Content is already HTML, should be sanitized via DOMPurify before passed here
    navigation: string,
    companyName: string
) => `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    :root {
      --brand-600: #0891b2;
      --brand-700: #0e7490;
    }
    .brand-gradient { background: linear-gradient(135deg, var(--brand-600), var(--brand-700)); }
    .prose h2 { margin-top: 2rem; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700; }
    .prose h3 { margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 600; }
    .prose p { margin-bottom: 1rem; line-height: 1.75; }
    .prose ul { margin-bottom: 1rem; padding-left: 1.5rem; list-style-type: disc; }
    .prose li { margin-bottom: 0.5rem; }
    .faq-item { border-bottom: 1px solid #e5e7eb; padding: 1.5rem 0; }
    .faq-item:last-child { border-bottom: none; }
  </style>
</head>
<body class="bg-gray-50 text-gray-900">
  <!-- Header -->
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-4">
      <nav class="flex items-center justify-between">
        <a href="index.html" class="text-xl font-bold text-cyan-700">${escapeHtml(companyName)}</a>
        <div class="flex gap-6">
          ${navigation}
        </div>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 py-12">
    ${content} 
  </main>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12 mt-16">
    <div class="max-w-6xl mx-auto px-4 text-center">
      <p class="text-gray-400">&copy; ${new Date().getFullYear()} ${escapeHtml(companyName)}. Tüm hakları saklıdır.</p>
    </div>
  </footer>
</body>
</html>`;

const NAVIGATION_ITEMS = [
    { type: 'HOMEPAGE', href: 'index.html', label: 'Ana Sayfa' },
    { type: 'ABOUT', href: 'hakkimizda.html', label: 'Hakkımızda' },
    { type: 'SERVICES', href: 'hizmetler.html', label: 'Hizmetler' },
    { type: 'FAQ', href: 'sss.html', label: 'SSS' },
    { type: 'CONTACT', href: 'iletisim.html', label: 'İletişim' },
];

// ================================
// GENERATOR CLASS
// ================================

export class StaticSiteGenerator {
    private siteData: SiteData;

    constructor(siteData: SiteData) {
        this.siteData = siteData;
    }

    /**
     * Tüm sayfaları oluştur
     */
    generateAllPages(): GeneratedPage[] {
        const pages: GeneratedPage[] = [];
        const navigation = this.generateNavigation();

        for (const navItem of NAVIGATION_ITEMS) {
            const content = this.siteData.contents.get(navItem.type);
            if (content && content.status === 'APPROVED') {
                pages.push(this.generatePage(navItem, content, navigation));
            }
        }

        return pages;
    }

    /**
     * Tek sayfa oluştur
     */
    private generatePage(
        navItem: typeof NAVIGATION_ITEMS[0],
        content: GeneratedContent,
        navigation: string
    ): GeneratedPage {
        // Sanitize content before wrapping
        const cleanContent = sanitizeHtml(content.content);
        const pageContent = this.wrapContent(cleanContent, navItem.type);

        const html = BASE_TEMPLATE(
            content.title || navItem.label,
            content.metaTitle || `${navItem.label} | ${this.siteData.project.company.name}`,
            content.metaDescription || `${this.siteData.project.company.name} - ${navItem.label}`,
            pageContent,
            navigation,
            this.siteData.project.company.name
        );

        return {
            filename: navItem.href,
            title: navItem.label,
            content: html,
            meta: {
                title: content.metaTitle || navItem.label,
                description: content.metaDescription || '',
            },
        };
    }

    /**
     * İçeriği sayfa tipine göre wrap et
     */
    private wrapContent(content: string, type: string): string {
        switch (type) {
            case 'HOMEPAGE':
                return `
          <div class="text-center mb-16">
            <div class="prose max-w-3xl mx-auto">
              ${content}
            </div>
          </div>
        `;
            case 'FAQ':
                return `
          <h1 class="text-3xl font-bold mb-8">Sıkça Sorulan Sorular</h1>
          <div class="max-w-3xl mx-auto">
            ${content}
          </div>
        `;
            default:
                return `
          <article class="prose max-w-3xl mx-auto">
            ${content}
          </article>
        `;
        }
    }

    /**
     * Navigation HTML oluştur
     */
    private generateNavigation(): string {
        return NAVIGATION_ITEMS
            .filter((item) => this.siteData.contents.has(item.type))
            .map(
                (item) =>
                    `<a href="${item.href}" class="text-gray-600 hover:text-cyan-700 transition-colors">${item.label}</a>`
            )
            .join('\n');
    }
}

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Proje için site verilerini hazırla
 */
export async function prepareSiteData(projectId: string): Promise<SiteData | null> {
    const project = await prisma.webProject.findUnique({
        where: { id: projectId },
        include: {
            company: true,
            domain: true,
            generatedContents: {
                where: { status: 'APPROVED' },
            },
        },
    });

    if (!project) return null;

    const contents = new Map(
        project.generatedContents.map((c) => [c.contentType, c])
    );

    return {
        project,
        contents,
        domain: project.domain?.name || project.company.name.toLowerCase().replace(/\s+/g, '-') + '.com',
    };
}

/**
 * Site oluştur ve dosyaları döndür
 */
export async function generateStaticSite(projectId: string): Promise<{
    success: boolean;
    pages?: GeneratedPage[];
    error?: string;
}> {
    try {
        const siteData = await prepareSiteData(projectId);

        if (!siteData) {
            return { success: false, error: 'Proje bulunamadı' };
        }

        if (siteData.contents.size === 0) {
            return { success: false, error: 'Onaylı içerik bulunamadı' };
        }

        const generator = new StaticSiteGenerator(siteData);
        const pages = generator.generateAllPages();

        if (pages.length === 0) {
            return { success: false, error: 'Hiç sayfa oluşturulamadı' };
        }

        return { success: true, pages };
    } catch (error) {
        console.error('generateStaticSite error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata',
        };
    }
}
