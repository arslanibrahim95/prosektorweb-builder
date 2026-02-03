/**
 * Automated Quote Generator for Web Projects
 *
 * Generates price quotes based on:
 * - Project complexity
 * - Number of pages
 * - Features requested
 * - AI provider usage
 * - Maintenance/hosting requirements
 */

import { PipelineStage, STAGE_METADATA } from "./types";

// ============================================
// PRICING CONFIGURATION
// ============================================

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  basePrice: number; // TL
  features: string[];
  maxPages: number;
  maxRevisions: number;
  includesHosting: boolean;
  includesDomain: boolean;
  supportLevel: "basic" | "standard" | "premium";
  deliveryDays: number;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Kucuk isletmeler icin temel web sitesi",
    basePrice: 7500,
    features: [
      "5 sayfa",
      "Responsive tasarim",
      "Temel SEO",
      "Iletisim formu",
      "1 yil hosting",
      "1 revizyon hakki",
    ],
    maxPages: 5,
    maxRevisions: 1,
    includesHosting: true,
    includesDomain: false,
    supportLevel: "basic",
    deliveryDays: 7,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Buyuyen isletmeler icin profesyonel site",
    basePrice: 15000,
    features: [
      "10 sayfa",
      "Responsive tasarim",
      "Gelismis SEO",
      "Blog sistemi",
      "Iletisim formu",
      "Google Analytics",
      "1 yil hosting + domain",
      "SSL sertifikasi",
      "2 revizyon hakki",
    ],
    maxPages: 10,
    maxRevisions: 2,
    includesHosting: true,
    includesDomain: true,
    supportLevel: "standard",
    deliveryDays: 14,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Kurumsal firmalar icin tam kapsamli cozum",
    basePrice: 35000,
    features: [
      "Sinirsiz sayfa",
      "Ozel tasarim",
      "Premium SEO paketi",
      "Blog + CMS",
      "Coklu dil destegi",
      "E-posta entegrasyonu",
      "CRM entegrasyonu",
      "1 yil hosting + domain",
      "SSL sertifikasi",
      "7/24 destek",
      "3 revizyon hakki",
    ],
    maxPages: 999,
    maxRevisions: 3,
    includesHosting: true,
    includesDomain: true,
    supportLevel: "premium",
    deliveryDays: 30,
  },
];

// ============================================
// ADD-ON FEATURES
// ============================================

export interface AddOnFeature {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "design" | "functionality" | "integration" | "support";
  estimatedDays: number;
}

export const ADD_ON_FEATURES: AddOnFeature[] = [
  // Design
  {
    id: "custom-design",
    name: "Ozel Tasarim",
    description: "Sifirdan ozel UI/UX tasarimi",
    price: 5000,
    category: "design",
    estimatedDays: 5,
  },
  {
    id: "animation-pack",
    name: "Animasyon Paketi",
    description: "Gelismis animasyonlar ve gecisler",
    price: 2500,
    category: "design",
    estimatedDays: 2,
  },
  {
    id: "dark-mode",
    name: "Karanlik Mod",
    description: "Otomatik karanlik/aydinlik tema",
    price: 1500,
    category: "design",
    estimatedDays: 1,
  },

  // Functionality
  {
    id: "blog-system",
    name: "Blog Sistemi",
    description: "Icerik yonetim paneli ile blog",
    price: 4000,
    category: "functionality",
    estimatedDays: 3,
  },
  {
    id: "appointment-system",
    name: "Randevu Sistemi",
    description: "Online randevu alma modulu",
    price: 6000,
    category: "functionality",
    estimatedDays: 4,
  },
  {
    id: "contact-forms",
    name: "Gelismis Formlar",
    description: "Coklu iletisim ve basvuru formlari",
    price: 2000,
    category: "functionality",
    estimatedDays: 2,
  },
  {
    id: "gallery",
    name: "Galeri Modulu",
    description: "Resim/video galerisi",
    price: 2500,
    category: "functionality",
    estimatedDays: 2,
  },
  {
    id: "multi-language",
    name: "Coklu Dil",
    description: "Turkce + 1 ek dil destegi",
    price: 3500,
    category: "functionality",
    estimatedDays: 3,
  },

  // Integrations
  {
    id: "whatsapp-integration",
    name: "WhatsApp Entegrasyonu",
    description: "WhatsApp Business API baglantisi",
    price: 1500,
    category: "integration",
    estimatedDays: 1,
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Interaktif harita entegrasyonu",
    price: 500,
    category: "integration",
    estimatedDays: 1,
  },
  {
    id: "social-media",
    name: "Sosyal Medya",
    description: "Instagram/Facebook feed entegrasyonu",
    price: 2000,
    category: "integration",
    estimatedDays: 2,
  },
  {
    id: "crm-integration",
    name: "CRM Entegrasyonu",
    description: "HubSpot/Salesforce baglantisi",
    price: 5000,
    category: "integration",
    estimatedDays: 3,
  },
  {
    id: "payment-gateway",
    name: "Odeme Entegrasyonu",
    description: "iyzico/PayTR odeme sistemi",
    price: 4000,
    category: "integration",
    estimatedDays: 3,
  },

  // Support
  {
    id: "monthly-maintenance",
    name: "Aylik Bakim",
    description: "Aylik guncelleme ve bakim (yillik)",
    price: 6000,
    category: "support",
    estimatedDays: 0,
  },
  {
    id: "priority-support",
    name: "Oncelikli Destek",
    description: "7/24 oncelikli teknik destek (yillik)",
    price: 12000,
    category: "support",
    estimatedDays: 0,
  },
  {
    id: "training",
    name: "Egitim",
    description: "2 saatlik kullanim egitimi",
    price: 1500,
    category: "support",
    estimatedDays: 1,
  },
];

// ============================================
// QUOTE GENERATION
// ============================================

export interface QuoteRequest {
  companyName: string;
  industry?: string;
  pageCount: number;
  features: string[]; // Add-on feature IDs
  preferredTier?: string;
  hasExistingSite: boolean;
  needsDomain: boolean;
  needsHosting: boolean;
  urgency: "normal" | "fast" | "urgent";
  notes?: string;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface GeneratedQuote {
  id: string;
  companyName: string;
  tier: PricingTier;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
  total: number;
  deliveryDays: number;
  validUntil: Date;
  createdAt: Date;
  notes: string[];
  aiProviderBreakdown: {
    stage: string;
    provider: string;
    description: string;
  }[];
}

/**
 * Generate a quote based on request parameters
 */
export function generateQuote(request: QuoteRequest): GeneratedQuote {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 30); // 30 days validity

  // Determine tier based on page count or preference
  let tier = PRICING_TIERS.find((t) => t.id === request.preferredTier);
  if (!tier) {
    if (request.pageCount <= 5) {
      tier = PRICING_TIERS[0]; // Starter
    } else if (request.pageCount <= 10) {
      tier = PRICING_TIERS[1]; // Professional
    } else {
      tier = PRICING_TIERS[2]; // Enterprise
    }
  }

  const lineItems: QuoteLineItem[] = [];
  let deliveryDays = tier.deliveryDays;

  // Base package
  lineItems.push({
    description: `${tier.name} Paket - ${tier.description}`,
    quantity: 1,
    unitPrice: tier.basePrice,
    totalPrice: tier.basePrice,
    category: "paket",
  });

  // Extra pages (beyond tier limit)
  if (request.pageCount > tier.maxPages) {
    const extraPages = request.pageCount - tier.maxPages;
    const extraPagePrice = 750; // per page
    lineItems.push({
      description: `Ekstra Sayfa (${extraPages} adet)`,
      quantity: extraPages,
      unitPrice: extraPagePrice,
      totalPrice: extraPages * extraPagePrice,
      category: "sayfa",
    });
    deliveryDays += Math.ceil(extraPages / 3); // 1 extra day per 3 pages
  }

  // Add-on features
  for (const featureId of request.features) {
    const feature = ADD_ON_FEATURES.find((f) => f.id === featureId);
    if (feature) {
      lineItems.push({
        description: feature.name,
        quantity: 1,
        unitPrice: feature.price,
        totalPrice: feature.price,
        category: feature.category,
      });
      deliveryDays += feature.estimatedDays;
    }
  }

  // Domain (if not included and requested)
  if (request.needsDomain && !tier.includesDomain) {
    lineItems.push({
      description: "Domain Kaydı (1 yıl)",
      quantity: 1,
      unitPrice: 350,
      totalPrice: 350,
      category: "altyapi",
    });
  }

  // Hosting (if not included and requested)
  if (request.needsHosting && !tier.includesHosting) {
    lineItems.push({
      description: "Hosting (1 yıl)",
      quantity: 1,
      unitPrice: 1200,
      totalPrice: 1200,
      category: "altyapi",
    });
  }

  // Urgency surcharge
  let urgencyMultiplier = 1;
  if (request.urgency === "fast") {
    urgencyMultiplier = 1.25;
    deliveryDays = Math.ceil(deliveryDays * 0.7);
    lineItems.push({
      description: "Hizli Teslimat (%25 ek)",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0, // Will be calculated as percentage
      category: "hizmet",
    });
  } else if (request.urgency === "urgent") {
    urgencyMultiplier = 1.5;
    deliveryDays = Math.ceil(deliveryDays * 0.5);
    lineItems.push({
      description: "Acil Teslimat (%50 ek)",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: "hizmet",
    });
  }

  // Calculate subtotal
  let subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Apply urgency multiplier
  if (urgencyMultiplier > 1) {
    const urgencyItem = lineItems.find((i) => i.description.includes("Teslimat"));
    if (urgencyItem) {
      urgencyItem.totalPrice = Math.round(subtotal * (urgencyMultiplier - 1));
      subtotal = Math.round(subtotal * urgencyMultiplier);
    }
  }

  // Discount calculation
  let discount = 0;
  let discountReason: string | undefined;

  // Volume discount
  if (subtotal > 50000) {
    discount = Math.round(subtotal * 0.1);
    discountReason = "Yuksek hacim indirimi (%10)";
  } else if (subtotal > 30000) {
    discount = Math.round(subtotal * 0.05);
    discountReason = "Hacim indirimi (%5)";
  }

  // Tax (KDV)
  const taxRate = 0.20; // 20% KDV
  const taxableAmount = subtotal - discount;
  const tax = Math.round(taxableAmount * taxRate);
  const total = taxableAmount + tax;

  // Notes
  const notes: string[] = [];
  if (tier.includesHosting) {
    notes.push("Hosting 1 yil ucretsiz dahildir.");
  }
  if (tier.includesDomain) {
    notes.push("Domain kaydı 1 yil ucretsiz dahildir.");
  }
  notes.push(`Tahmini teslimat suresi: ${deliveryDays} is gunu`);
  notes.push("Teklif 30 gun gecerlidir.");
  notes.push("Fiyatlara %20 KDV dahildir.");

  // AI Provider breakdown
  const aiProviderBreakdown = Object.entries(STAGE_METADATA).map(([stage, meta]) => ({
    stage: meta.name,
    provider: meta.aiProvider,
    description: meta.aiProviderDescription,
  }));

  return {
    id: `QT-${Date.now().toString(36).toUpperCase()}`,
    companyName: request.companyName,
    tier,
    lineItems,
    subtotal,
    discount,
    discountReason,
    tax,
    total,
    deliveryDays,
    validUntil,
    createdAt: now,
    notes,
    aiProviderBreakdown,
  };
}

/**
 * Format quote as text for display
 */
export function formatQuoteAsText(quote: GeneratedQuote): string {
  const lines: string[] = [];

  lines.push("═".repeat(50));
  lines.push(`FİYAT TEKLİFİ - ${quote.id}`);
  lines.push("═".repeat(50));
  lines.push("");
  lines.push(`Firma: ${quote.companyName}`);
  lines.push(`Paket: ${quote.tier.name}`);
  lines.push(`Tarih: ${quote.createdAt.toLocaleDateString("tr-TR")}`);
  lines.push(`Gecerlilik: ${quote.validUntil.toLocaleDateString("tr-TR")}`);
  lines.push("");
  lines.push("─".repeat(50));
  lines.push("KALEMLER");
  lines.push("─".repeat(50));

  for (const item of quote.lineItems) {
    const price = item.totalPrice.toLocaleString("tr-TR");
    lines.push(`• ${item.description}`);
    lines.push(`  ${price} TL`);
  }

  lines.push("");
  lines.push("─".repeat(50));
  lines.push(`Ara Toplam:     ${quote.subtotal.toLocaleString("tr-TR")} TL`);

  if (quote.discount > 0) {
    lines.push(`İndirim:        -${quote.discount.toLocaleString("tr-TR")} TL`);
    if (quote.discountReason) {
      lines.push(`                (${quote.discountReason})`);
    }
  }

  lines.push(`KDV (%20):      ${quote.tax.toLocaleString("tr-TR")} TL`);
  lines.push("─".repeat(50));
  lines.push(`TOPLAM:         ${quote.total.toLocaleString("tr-TR")} TL`);
  lines.push("═".repeat(50));
  lines.push("");
  lines.push("NOTLAR:");
  for (const note of quote.notes) {
    lines.push(`• ${note}`);
  }

  return lines.join("\n");
}

/**
 * Convert quote to proposal format for database
 */
export function quoteToProposalData(quote: GeneratedQuote): {
  title: string;
  description: string;
  items: {
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: Date;
  notes: string;
} {
  return {
    title: `${quote.companyName} - Web Sitesi Projesi`,
    description: `${quote.tier.name} paket ile web sitesi gelistirme teklifi`,
    items: quote.lineItems.map((item) => ({
      name: item.description,
      description: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: "adet",
    })),
    subtotal: quote.subtotal,
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
    validUntil: quote.validUntil,
    notes: quote.notes.join("\n"),
  };
}
