/**
 * Local SEO Content Generator
 *
 * OSGB web siteleri icin lokasyon bazli icerik uretimi
 * Her il icin: kendi ili + komsu iller + tum ilceler
 */

import {
  Province,
  District,
  getProvinceById,
  getServiceAreaProvinces,
  getServiceAreaDistricts,
  calculateTotalPages,
  TURKEY_PROVINCES,
} from "./turkey-geo-data";

import {
  OsgbService,
  OSGB_SERVICES,
  generateLocationKeywords,
  generatePageTitle,
  generateMetaDescription,
  getMandatoryServices,
} from "./osgb-services";

// ============================================
// TYPES
// ============================================

export interface LocalPage {
  // URL & Routing
  slug: string;
  fullPath: string;
  canonicalUrl: string;

  // SEO Meta
  title: string;
  metaDescription: string;
  keywords: string[];
  h1: string;

  // Location Context
  province: Province;
  district?: District;
  isDistrictPage: boolean;

  // Service Context
  service: OsgbService;

  // Content Sections
  sections: ContentSection[];

  // Schema.org Data
  schema: LocalBusinessSchema;

  // Internal Linking
  relatedPages: string[];
  neighborLinks: { name: string; url: string; districtCount: number }[];
  breadcrumbs: BreadcrumbItem[];
}

export interface ContentSection {
  id: string;
  type: "hero" | "text" | "features" | "faq" | "cta" | "stats" | "testimonial";
  heading?: string;
  content: string;
  data?: Record<string, unknown>;
}

export interface LocalBusinessSchema {
  "@context": "https://schema.org";
  "@type": "LocalBusiness" | "ProfessionalService";
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address: {
    "@type": "PostalAddress";
    addressLocality: string;
    addressRegion: string;
    addressCountry: "TR";
  };
  areaServed: {
    "@type": "City" | "AdministrativeArea";
    name: string;
  }[];
  serviceType?: string[];
  priceRange?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SiteStructure {
  provinceId: number;
  provinceName: string;
  domain: string;
  totalPages: number;
  pages: LocalPage[];
  sitemap: SitemapEntry[];
}

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: number;
}

// ============================================
// URL GENERATOR
// ============================================

/**
 * Lokasyon bazli URL olustur
 */
export function generateLocalUrl(
  service: OsgbService,
  province: Province,
  district?: District
): string {
  // URL Pattern: /hizmetler/[hizmet-slug]/[sehir]/[ilce]
  // veya: /[sehir]-[hizmet-slug]/[ilce]

  // Tercih edilen pattern (SEO icin daha iyi):
  // /istanbul-isyeri-hekimi/
  // /istanbul-isyeri-hekimi/kadikoy/

  const baseSlug = `${province.slug}-${service.slug}`;

  if (district) {
    return `/${baseSlug}/${district.slug}/`;
  }

  return `/${baseSlug}/`;
}

/**
 * Alternatif URL pattern (hizmet oncelikli)
 */
export function generateServiceFirstUrl(
  service: OsgbService,
  province: Province,
  district?: District
): string {
  // URL Pattern: /isyeri-hekimi/istanbul/kadikoy/

  if (district) {
    return `/${service.slug}/${province.slug}/${district.slug}/`;
  }

  return `/${service.slug}/${province.slug}/`;
}

// ============================================
// CONTENT GENERATORS
// ============================================

/**
 * Hero section icerigi olustur
 */
function generateHeroSection(
  service: OsgbService,
  province: Province,
  district?: District,
  companyName?: string
): ContentSection {
  const location = district ? `${district.name}, ${province.name}` : province.name;
  const locationGenitive = district
    ? `${district.name} ve ${province.name} bolgesinde`
    : `${province.name} ve cevresinde`;

  return {
    id: "hero",
    type: "hero",
    heading: `${location} ${service.name}`,
    content: `${locationGenitive} profesyonel ${service.name.toLowerCase()} hizmeti. 6331 sayili Is Sagligi ve Guvenligi Kanunu kapsaminda tum yasal gereksinimleri karsiliyoruz.`,
    data: {
      location,
      serviceName: service.name,
      companyName,
      ctaText: "Ucretsiz Teklif Alin",
      ctaPhone: true,
    },
  };
}

/**
 * Hizmet tanimi section'i olustur
 */
function generateServiceDefinitionSection(
  service: OsgbService,
  province: Province,
  district?: District
): ContentSection {
  const location = district ? district.name : province.name;

  const content = `
${service.name}, ${service.shortDescription}.

${location} bolgesinde faaliyet gosteren isletmeler icin ${service.name.toLowerCase()} hizmeti sunuyoruz.
Deneyimli ekibimiz ve guncel mevzuat bilgisiyle isletmenizin tum ISG ihtiyaclarini karsiliyoruz.

### Neden ${location}'da Bizi Tercih Etmelisiniz?

- **Yerel Uzmanlik**: ${province.name} ve cevre illerde yillardir hizmet veriyoruz
- **Hizli Mudahale**: Bolgesel yakinlik sayesinde acil durumlarda aninda yaninizdayiz
- **Mevzuat Uyumu**: Tum yasal gereksinimleri eksiksiz karsiliyoruz
- **Uygun Fiyat**: Bolgesel fiyat avantaji sunuyoruz
  `.trim();

  return {
    id: "hizmet_tanimi",
    type: "text",
    heading: `${location}'da ${service.name} Hizmeti`,
    content,
  };
}

/**
 * Yasal zorunluluk section'i olustur
 */
function generateLegalRequirementSection(
  service: OsgbService
): ContentSection {
  const legalRefs = service.legalReferences?.join(", ") || "6331 sayili Kanun";

  const content = `
### Yasal Dayanak

${service.name} hizmeti, ${legalRefs} kapsaminda duzenlenmistir.

#### Kimler Icin Zorunlu?

- **Az Tehlikeli Isyerleri**: 50 ve uzerinde calisan
- **Tehlikeli Isyerleri**: 50 ve uzerinde calisan (daha sik hizmet)
- **Cok Tehlikeli Isyerleri**: Tum calisanlar icin zorunlu

> **Onemli**: Yasal yukumluluklerin yerine getirilmemesi durumunda idari para cezalari uygulanmaktadir.
  `.trim();

  return {
    id: "yasal_zorunluluk",
    type: "text",
    heading: "Yasal Zorunluluklar",
    content,
  };
}

/**
 * Hizmet kapsami section'i olustur
 */
function generateServiceScopeSection(
  service: OsgbService,
  province: Province
): ContentSection {
  const neighborProvinces = province.neighbors
    .map((id) => getProvinceById(id))
    .filter((p): p is Province => p !== undefined);

  const neighborLines = neighborProvinces
    .map((n) => {
      const url = generateLocalUrl(service, n);
      return `- [${n.name} ${service.name}](${url}): ${n.districts.length} ilce dahil`;
    })
    .join("\n");

  const totalDistricts = neighborProvinces.reduce(
    (sum, n) => sum + n.districts.length,
    province.districts.length
  );

  const content = `
### Hizmet Verdigimiz Bolgeler

**${province.name}** merkezli olarak toplam **${neighborProvinces.length + 1} il** ve **${totalDistricts} ilceye** hizmet vermekteyiz:

- **${province.name}**: ${province.districts.length} ilce dahil (merkez)
${neighborLines}

### Neden Komsu Illere de Hizmet Veriyoruz?

OSGB mevzuatina gore, bir isletme komsu ildeki OSGB'den hizmet alabilir. ${province.name} merkezli ekibimiz, ${neighborProvinces.map((n) => n.name).join(", ")} illerindeki isletmelere de ayni kalitede ve uygun fiyatli ${service.name.toLowerCase()} hizmeti sunmaktadir.
  `.trim();

  return {
    id: "hizmet_kapsami",
    type: "text",
    heading: `${province.name} ve Komsu Illerde ${service.name}`,
    content,
  };
}

/**
 * SSS section'i olustur
 */
function generateFaqSection(
  service: OsgbService,
  province: Province,
  district?: District
): ContentSection {
  const location = district ? district.name : province.name;

  // Hizmete ozel SSS
  const faqs = service.keywords.longTail.slice(0, 5).map((question, i) => ({
    question: question.charAt(0).toUpperCase() + question.slice(1) + "?",
    answer: generateFaqAnswer(question, location, service),
  }));

  // Lokasyona ozel SSS ekle
  faqs.push({
    question: `${location}'da OSGB hizmeti nasil alabilirim?`,
    answer: `${location} bolgesinde OSGB hizmeti almak icin bizi arayin veya iletisim formumuzu doldurun. 24 saat icinde size donuyoruz.`,
  });

  // Komsu il SSS ekle
  const neighborNames = province.neighbors
    .slice(0, 3)
    .map((id) => getProvinceById(id)?.name)
    .filter(Boolean);

  if (neighborNames.length > 0) {
    faqs.push({
      question: `${province.name} disinda hangi illere ${service.name.toLowerCase()} hizmeti veriyorsunuz?`,
      answer: `${province.name} merkezli ekibimiz, ${neighborNames.join(", ")} ve diger komsu illerdeki isletmelere de ${service.name.toLowerCase()} hizmeti vermektedir. OSGB mevzuatina gore komsu illerden hizmet almak mumkundur.`,
    });

    faqs.push({
      question: `${neighborNames[0]}'dan ${province.name}'daki OSGB'den hizmet alabilir miyim?`,
      answer: `Evet, ${neighborNames[0]} ile ${province.name} sinir komsusu oldugu icin ${neighborNames[0]}'daki isletmeler ${province.name} merkezli OSGB'mizden ${service.name.toLowerCase()} hizmeti alabilir.`,
    });
  }

  return {
    id: "sss",
    type: "faq",
    heading: "Sikca Sorulan Sorular",
    content: "",
    data: { faqs },
  };
}

/**
 * SSS cevabi olustur
 */
function generateFaqAnswer(
  question: string,
  location: string,
  service: OsgbService
): string {
  // Basit pattern matching ile cevap olustur
  if (question.includes("fiyat")) {
    return `${location} bolgesinde ${service.name.toLowerCase()} fiyatlari isletme buyuklugu ve tehlike sinifina gore degisir. Ucretsiz keşif ve fiyat teklifi icin bizi arayin.`;
  }
  if (question.includes("zorunlu")) {
    return `Evet, 6331 sayili Kanun kapsaminda belirli kriterleri karsilayan tum isletmeler icin ${service.name.toLowerCase()} zorunludur.`;
  }
  if (question.includes("nasil")) {
    return `${service.name} hizmeti profesyonel OSGB uzmanlarimiz tarafindan mevzuata uygun sekilde verilmektedir. Detayli bilgi icin bizi arayin.`;
  }
  return `${location} bolgesinde ${service.name.toLowerCase()} hizmeti hakkinda detayli bilgi almak icin bizimle iletisime gecin.`;
}

/**
 * CTA section'i olustur
 */
function generateCtaSection(
  service: OsgbService,
  province: Province,
  district?: District
): ContentSection {
  const location = district ? `${district.name}, ${province.name}` : province.name;

  return {
    id: "iletisim_cta",
    type: "cta",
    heading: `${location}'da ${service.name} Icin Hemen Arayin`,
    content: `Profesyonel ${service.name.toLowerCase()} hizmeti icin ucretsiz keşif ve fiyat teklifi alin.`,
    data: {
      primaryCta: {
        text: "Hemen Arayin",
        type: "phone",
      },
      secondaryCta: {
        text: "Teklif Formu",
        type: "form",
      },
    },
  };
}

// ============================================
// SCHEMA.ORG GENERATOR
// ============================================

/**
 * LocalBusiness schema olustur
 */
function generateLocalBusinessSchema(
  service: OsgbService,
  province: Province,
  district?: District,
  companyName?: string,
  baseUrl?: string
): LocalBusinessSchema {
  const location = district ? `${district.name}, ${province.name}` : province.name;
  const url = baseUrl
    ? `${baseUrl}${generateLocalUrl(service, province, district)}`
    : generateLocalUrl(service, province, district);

  // Hizmet verilen bolgeler
  const areaServed: LocalBusinessSchema["areaServed"] = [
    {
      "@type": "City",
      name: province.name,
    },
  ];

  // Komsu illeri ekle
  province.neighbors.forEach((neighborId) => {
    const neighbor = getProvinceById(neighborId);
    if (neighbor) {
      areaServed.push({
        "@type": "AdministrativeArea",
        name: neighbor.name,
      });
    }
  });

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: companyName || `${province.name} OSGB`,
    description: generateMetaDescription(service, province.name, district?.name),
    url,
    address: {
      "@type": "PostalAddress",
      addressLocality: district?.name || province.name,
      addressRegion: province.name,
      addressCountry: "TR",
    },
    areaServed,
    serviceType: [service.name, ...service.keywords.primary],
    priceRange: "$$",
  };
}

// ============================================
// PAGE GENERATOR
// ============================================

/**
 * Tek bir lokasyon sayfasi olustur
 */
export function generateLocalPage(
  service: OsgbService,
  province: Province,
  district?: District,
  options?: {
    companyName?: string;
    baseUrl?: string;
    phone?: string;
    email?: string;
  }
): LocalPage {
  const { companyName, baseUrl } = options || {};

  const slug = generateLocalUrl(service, province, district);
  const fullPath = slug;
  const canonicalUrl = baseUrl ? `${baseUrl}${slug}` : slug;

  // SEO Meta
  const title = generatePageTitle(service, province.name, district?.name, companyName);
  const metaDescription = generateMetaDescription(service, province.name, district?.name);
  const keywords = generateLocationKeywords(service, province.name, district?.name);
  const h1 = district
    ? `${district.name} ${service.name}`
    : `${province.name} ${service.name}`;

  // Content Sections
  const sections: ContentSection[] = [
    generateHeroSection(service, province, district, companyName),
    generateServiceDefinitionSection(service, province, district),
    generateLegalRequirementSection(service),
    generateServiceScopeSection(service, province),
    generateFaqSection(service, province, district),
    generateCtaSection(service, province, district),
  ];

  // Schema
  const schema = generateLocalBusinessSchema(
    service,
    province,
    district,
    companyName,
    baseUrl
  );

  // Related Pages (ayni hizmet, diger lokasyonlar)
  const relatedPages: string[] = [];

  // Ayni ildeki diger ilceler
  if (district) {
    province.districts
      .filter((d) => d.slug !== district.slug)
      .slice(0, 5)
      .forEach((d) => {
        relatedPages.push(generateLocalUrl(service, province, d));
      });
  }

  // Tum komsu iller
  const neighborLinks: LocalPage["neighborLinks"] = [];
  province.neighbors.forEach((neighborId) => {
    const neighbor = getProvinceById(neighborId);
    if (neighbor) {
      const url = generateLocalUrl(service, neighbor);
      relatedPages.push(url);
      neighborLinks.push({
        name: neighbor.name,
        url,
        districtCount: neighbor.districts.length,
      });
    }
  });

  // Diger hizmetler (ayni il, farkli hizmet)
  if (!district) {
    OSGB_SERVICES
      .filter((s) => s.id !== service.id)
      .slice(0, 3)
      .forEach((s) => {
        relatedPages.push(generateLocalUrl(s, province));
      });
  }

  // Breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Ana Sayfa", url: "/" },
    { name: service.name, url: `/${service.slug}/` },
    { name: province.name, url: generateLocalUrl(service, province) },
  ];

  if (district) {
    breadcrumbs.push({
      name: district.name,
      url: generateLocalUrl(service, province, district),
    });
  }

  return {
    slug,
    fullPath,
    canonicalUrl,
    title,
    metaDescription,
    keywords,
    h1,
    province,
    district,
    isDistrictPage: !!district,
    service,
    sections,
    schema,
    relatedPages,
    neighborLinks,
    breadcrumbs,
  };
}

// ============================================
// BULK PAGE GENERATOR
// ============================================

/**
 * Bir OSGB icin tum lokasyon sayfalarini olustur
 */
export function generateAllLocalPages(
  provinceId: number,
  options?: {
    companyName?: string;
    baseUrl?: string;
    services?: OsgbService[];
    includeDistricts?: boolean;
  }
): LocalPage[] {
  const {
    companyName,
    baseUrl,
    services = getMandatoryServices(), // Default: zorunlu hizmetler
    includeDistricts = true,
  } = options || {};

  const pages: LocalPage[] = [];

  // Hizmet alani (kendi il + komsular)
  const serviceArea = getServiceAreaProvinces(provinceId);

  for (const province of serviceArea) {
    for (const service of services) {
      // Il sayfasi
      pages.push(
        generateLocalPage(service, province, undefined, { companyName, baseUrl })
      );

      // Ilce sayfalari
      if (includeDistricts) {
        for (const district of province.districts) {
          pages.push(
            generateLocalPage(service, province, district, { companyName, baseUrl })
          );
        }
      }
    }
  }

  return pages;
}

/**
 * Site yapisini olustur (sitemap dahil)
 */
export function generateSiteStructure(
  provinceId: number,
  domain: string,
  options?: {
    companyName?: string;
    services?: OsgbService[];
    includeDistricts?: boolean;
  }
): SiteStructure {
  const province = getProvinceById(provinceId);
  if (!province) {
    throw new Error(`Province not found: ${provinceId}`);
  }

  const baseUrl = `https://${domain}`;
  const pages = generateAllLocalPages(provinceId, {
    ...options,
    baseUrl,
  });

  // Sitemap entries
  const now = new Date().toISOString().split("T")[0];
  const sitemap: SitemapEntry[] = pages.map((page) => ({
    loc: page.canonicalUrl,
    lastmod: now,
    changefreq: page.isDistrictPage ? "monthly" : "weekly",
    priority: page.isDistrictPage ? 0.7 : 0.9,
  }));

  // Ana sayfa ekle
  sitemap.unshift({
    loc: baseUrl,
    lastmod: now,
    changefreq: "daily",
    priority: 1.0,
  });

  return {
    provinceId,
    provinceName: province.name,
    domain,
    totalPages: pages.length + 1, // +1 for homepage
    pages,
    sitemap,
  };
}

// ============================================
// SITEMAP XML GENERATOR
// ============================================

const SITEMAP_MAX_URLS = 50000;
const SITEMAP_SPLIT_THRESHOLD = 1000;

/**
 * Sitemap XML olustur
 */
export function generateSitemapXml(entries: SitemapEntry[]): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const footer = `</urlset>`;

  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("\n");

  return `${header}\n${urls}\n${footer}`;
}

/**
 * Buyuk siteler icin sitemap index olustur
 * 1000+ URL varsa birden fazla sitemap dosyasina boler
 */
export function generateSitemapIndex(
  entries: SitemapEntry[],
  baseUrl: string,
  entriesPerSitemap: number = SITEMAP_SPLIT_THRESHOLD
): { index: string; sitemaps: { filename: string; xml: string }[] } {
  if (entries.length <= entriesPerSitemap) {
    return {
      index: "",
      sitemaps: [{ filename: "sitemap.xml", xml: generateSitemapXml(entries) }],
    };
  }

  const chunks: SitemapEntry[][] = [];
  for (let i = 0; i < entries.length; i += entriesPerSitemap) {
    chunks.push(entries.slice(i, i + entriesPerSitemap));
  }

  const now = new Date().toISOString().split("T")[0];
  const sitemaps = chunks.map((chunk, i) => ({
    filename: `sitemap-${i + 1}.xml`,
    xml: generateSitemapXml(chunk),
  }));

  const indexHeader = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const indexFooter = `</sitemapindex>`;

  const indexEntries = sitemaps
    .map(
      (s) => `  <sitemap>
    <loc>${escapeXml(`${baseUrl}/${s.filename}`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return {
    index: `${indexHeader}\n${indexEntries}\n${indexFooter}`,
    sitemaps,
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ============================================
// STATISTICS
// ============================================

/**
 * Toplam sayfa sayisini hesapla (tum Turkiye icin)
 */
export function calculateTotalPagesForAllProvinces(
  services: OsgbService[] = getMandatoryServices(),
  includeDistricts: boolean = true
): {
  totalProvinces: number;
  totalPages: number;
  breakdown: { provinceId: number; provinceName: string; pages: number }[];
} {
  const breakdown: { provinceId: number; provinceName: string; pages: number }[] = [];
  let totalPages = 0;

  for (const province of TURKEY_PROVINCES) {
    const pageCount = calculateTotalPages(province.id);
    const serviceMultiplier = services.length;

    let pages = pageCount.provincePages * serviceMultiplier;
    if (includeDistricts) {
      pages += pageCount.districtPages * serviceMultiplier;
    }

    // +1 for province homepage
    pages += 1;

    breakdown.push({
      provinceId: province.id,
      provinceName: province.name,
      pages,
    });

    totalPages += pages;
  }

  return {
    totalProvinces: TURKEY_PROVINCES.length,
    totalPages,
    breakdown,
  };
}

/**
 * Ornek cikti: Istanbul icin sayfa sayisi
 */
export function getExampleStats(provinceId: number = 34): void {
  const province = getProvinceById(provinceId);
  if (!province) return;

  const pageCount = calculateTotalPages(provinceId);
  const services = getMandatoryServices();

  console.log(`\n=== ${province.name} OSGB Sayfa Istatistikleri ===\n`);
  console.log(`Hizmet Alani: ${province.name} + ${province.neighbors.length} komsu il`);
  console.log(`Toplam Il: ${pageCount.provincePages}`);
  console.log(`Toplam Ilce: ${pageCount.districtPages}`);
  console.log(`Hizmet Sayisi: ${services.length}`);
  console.log(`---`);
  console.log(`Il Sayfalari: ${pageCount.provincePages * services.length}`);
  console.log(`Ilce Sayfalari: ${pageCount.districtPages * services.length}`);
  console.log(`TOPLAM: ${pageCount.total * services.length} sayfa`);
}
