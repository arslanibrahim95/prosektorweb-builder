/**
 * OSGB Local SEO Module
 *
 * Turkiye geneli 81 il icin lokasyon bazli SEO icerik sistemi
 *
 * Kullanim:
 * ```typescript
 * import { generateSiteStructure, OSGB_SERVICES } from '@/features/ai-generation/lib/pipeline/seo";
 *
 * // Istanbul icin site yapisi olustur
 * const site = generateSiteStructure(34, "istanbul-osgb.com", {
 *   companyName: "Istanbul OSGB",
 *   services: OSGB_SERVICES,
 *   includeDistricts: true,
 * });
 *
 * console.log(`Toplam sayfa: ${site.totalPages}`);
 * ```
 */

// Geographic Data
export {
  // Types
  type Province,
  type District,
  type TurkeyRegion,

  // Data
  TURKEY_PROVINCES,

  // Functions
  getProvinceById,
  getProvinceBySlug,
  getNeighborProvinces,
  getServiceAreaProvinces,
  getServiceAreaDistricts,
  calculateTotalPages,
  getProvincesByRegion,
  getAllProvinces,
  getIndustrialProvinces,

  // Komsuluk Iliskileri
  areNeighbors,
  getCommonNeighbors,
  validateNeighborConsistency,
  findShortestPath,
  getProvincesWithinDistance,
} from "./turkey-geo-data";

// OSGB Services
export {
  // Types
  type OsgbService,

  // Data
  OSGB_SERVICES,

  // Functions
  getServiceById,
  getServiceBySlug,
  getAllServices,
  getMandatoryServices,
  generateLocationKeywords,
  generatePageTitle,
  generateMetaDescription,
} from "./osgb-services";

// Local SEO Generator
export {
  // Types
  type LocalPage,
  type ContentSection,
  type LocalBusinessSchema,
  type BreadcrumbItem,
  type SiteStructure,
  type SitemapEntry,

  // URL Generators
  generateLocalUrl,
  generateServiceFirstUrl,

  // Page Generators
  generateLocalPage,
  generateAllLocalPages,
  generateSiteStructure,

  // Sitemap
  generateSitemapXml,
  generateSitemapIndex,

  // Statistics
  calculateTotalPagesForAllProvinces,
  getExampleStats,
} from "./local-seo-generator";

// Content Templates
export {
  // Types
  type ContentTemplate,
  type TemplateSectionDef,
  type TemplateVariables,
  type RenderedContent,

  // Templates
  CONTENT_TEMPLATES,
  ISYERI_HEKIMI_TEMPLATE,
  IS_GUVENLIGI_UZMANI_TEMPLATE,
  RISK_ANALIZI_TEMPLATE,
  ISG_EGITIMI_TEMPLATE,
  ILKYARDIM_EGITIMI_TEMPLATE,
  YANGIN_EGITIMI_TEMPLATE,
  SAGLIK_TARAMASI_TEMPLATE,
  ACIL_DURUM_PLANI_TEMPLATE,
  ISG_KURULU_TEMPLATE,
  ONAYLI_DEFTER_TEMPLATE,
  ISG_KATIP_TEMPLATE,

  // Functions
  prepareVariables,
  renderTemplate,
  getTemplateForService,
  renderPageContent,
} from "./content-templates";
