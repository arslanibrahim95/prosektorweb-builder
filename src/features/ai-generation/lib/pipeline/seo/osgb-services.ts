/**
 * OSGB Hizmetleri - SEO Icin Hizmet Tanimlari
 *
 * Her hizmet icin:
 * - Anahtar kelimeler
 * - Sayfa yapisi
 * - Icerik sablonu
 */

export interface OsgbService {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  keywords: {
    primary: string[];
    secondary: string[];
    longTail: string[];
  };
  // Lokasyon bazli keyword pattern'leri
  locationKeywordPatterns: string[];
  // Sayfa icerigi icin zorunlu section'lar
  requiredSections: string[];
  // Hedef sektorler (varsa)
  targetSectors?: string[];
  // Yasal dayanak referanslari
  legalReferences?: string[];
}

/**
 * Temel OSGB Hizmetleri
 */
export const OSGB_SERVICES: OsgbService[] = [
  // =========================================
  // ZORUNLU HIZMETLER (6331 sayılı kanun)
  // =========================================
  {
    id: "isyeri-hekimi",
    name: "Isyeri Hekimligi",
    slug: "isyeri-hekimi",
    shortDescription: "6331 sayili kanun kapsaminda isyeri hekimligi hizmeti",
    keywords: {
      primary: ["isyeri hekimi", "isyeri hekimligi", "osgb hekim"],
      secondary: ["is sagligi hekimi", "isci sagligi", "saglik gozetimi"],
      longTail: [
        "isyeri hekimi fiyatlari",
        "isyeri hekimi ne is yapar",
        "isyeri hekimi zorunlu mu",
        "kac calisana isyeri hekimi gerekir",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} isyeri hekimi",
      "{sehir} isyeri hekimligi",
      "{ilce} isyeri hekimi",
      "{sehir} osgb isyeri hekimi",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "yasal_zorunluluk",
      "hizmet_kapsami",
      "kimler_icin",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
      "Isyeri Hekimi ve Diger Saglik Personelinin Gorev, Yetki, Sorumluluk ve Egitimlerine Dair Yonetmelik",
    ],
  },
  {
    id: "is-guvenligi-uzmani",
    name: "Is Guvenligi Uzmanligi",
    slug: "is-guvenligi-uzmani",
    shortDescription: "A, B, C sinifi is guvenligi uzmanligi hizmeti",
    keywords: {
      primary: ["is guvenligi uzmani", "isg uzmani", "osgb uzman"],
      secondary: ["a sinifi uzman", "b sinifi uzman", "c sinifi uzman"],
      longTail: [
        "is guvenligi uzmani fiyatlari",
        "is guvenligi uzmani ne yapar",
        "hangi sinif uzman gerekir",
        "tehlike sinifina gore uzman",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} is guvenligi uzmani",
      "{ilce} isg uzmani",
      "{sehir} osgb uzman",
      "{sehir} a sinifi uzman",
      "{sehir} b sinifi uzman",
      "{sehir} c sinifi uzman",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "uzman_siniflari",
      "tehlike_siniflari",
      "gorev_ve_yetkiler",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
      "Is Guvenligi Uzmanlarinin Gorev, Yetki, Sorumluluk ve Egitimlerine Iliskin Yonetmelik",
    ],
  },
  {
    id: "risk-analizi",
    name: "Risk Degerlendirmesi",
    slug: "risk-analizi",
    shortDescription: "Isyeri risk analizi ve degerlendirme hizmeti",
    keywords: {
      primary: ["risk analizi", "risk degerlendirmesi", "is guvenligi risk"],
      secondary: ["tehlike tespiti", "risk puanlama", "risk haritasi"],
      longTail: [
        "risk analizi nasil yapilir",
        "risk analizi zorunlu mu",
        "risk analizi fiyati",
        "kac yilda bir risk analizi",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} risk analizi",
      "{sehir} risk degerlendirmesi",
      "{ilce} isyeri risk analizi",
      "{sektor} risk analizi {sehir}",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "yasal_zorunluluk",
      "risk_metodolojisi",
      "surec_adimlari",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    targetSectors: [
      "insaat",
      "uretim",
      "kimya",
      "tekstil",
      "gida",
      "metal",
      "otomotiv",
    ],
    legalReferences: [
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
      "Is Sagligi ve Guvenligi Risk Degerlendirmesi Yonetmeligi",
      "2026 Yili Guncel Idari Para Cezalari Mevzuati",
    ],
  },

  // =========================================
  // EGITIM HIZMETLERI
  // =========================================
  {
    id: "isg-egitimi",
    name: "Is Sagligi ve Guvenligi Egitimi",
    slug: "is-guvenligi-egitimi",
    shortDescription: "Temel ISG, tehlike sinifi ve isbaşı egitimleri",
    keywords: {
      primary: ["is guvenligi egitimi", "isg egitimi", "calisan egitimi"],
      secondary: ["tehlike sinifi egitimi", "isbasi egitimi", "periyodik egitim"],
      longTail: [
        "is guvenligi egitimi zorunlu mu",
        "kac saatlik egitim gerekir",
        "is guvenligi egitimi fiyati",
        "online is guvenligi egitimi",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} is guvenligi egitimi",
      "{sehir} isg egitimi",
      "{ilce} calisan egitimi",
      "{sehir} isyerinde egitim",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "egitim_turleri",
      "egitim_sureleri",
      "egitim_metodolojisi",
      "sertifika_bilgi",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
      "Calisanlarin Is Sagligi ve Guvenligi Egitimlerinin Usul ve Esaslari Hakkinda Yonetmelik",
    ],
  },
  {
    id: "ilkyardim-egitimi",
    name: "Ilkyardim Egitimi",
    slug: "ilkyardim-egitimi",
    shortDescription: "Sertifikali ilkyardim ve temel yasam destegi egitimi",
    keywords: {
      primary: ["ilkyardim egitimi", "ilk yardim kursu", "ilkyardimci egitimi"],
      secondary: ["tyd egitimi", "cpr egitimi", "acil mudahale"],
      longTail: [
        "ilkyardim sertifikasi nasil alinir",
        "ilkyardim egitimi fiyati",
        "kac calisana ilkyardimci",
        "ilkyardim egitimi ne kadar surer",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} ilkyardim egitimi",
      "{sehir} ilkyardim kursu",
      "{ilce} ilkyardimci egitimi",
      "{sehir} sertifikali ilkyardim",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "egitim_icerigi",
      "sertifika_bilgi",
      "kimler_olmali",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "Ilkyardim Yonetmeligi",
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
    ],
  },
  {
    id: "yangin-egitimi",
    name: "Yangin Egitimi",
    slug: "yangin-egitimi",
    shortDescription: "Yangin tatbikatı ve yanginla mucadele egitimi",
    keywords: {
      primary: ["yangin egitimi", "yangin tatbikati", "yangin sozdurme"],
      secondary: ["yangin tupu kullanimi", "tahliye egitimi", "yangin guvenligi"],
      longTail: [
        "yangin egitimi zorunlu mu",
        "yangin tatbikati nasil yapilir",
        "kac ayda bir yangin tatbikati",
        "yangin egitimi fiyati",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} yangin egitimi",
      "{sehir} yangin tatbikati",
      "{ilce} yangin sozdurme egitimi",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "egitim_icerigi",
      "tatbikat_bilgi",
      "ekipman_tanitimi",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "Binaların Yangindan Korunmasi Hakkinda Yonetmelik",
      "Is Sagligi ve Guvenligi Kanunu",
    ],
  },

  // =========================================
  // SAGLIK HIZMETLERI
  // =========================================
  {
    id: "saglik-taramasi",
    name: "Ise Giris ve Periyodik Muayene",
    slug: "saglik-taramasi",
    shortDescription: "Ise giris, periyodik ve isyeri ortam saglik taramalari",
    keywords: {
      primary: ["ise giris muayenesi", "periyodik muayene", "saglik taramasi"],
      secondary: ["isitme testi", "gorme testi", "akciger filmi", "saglik raporu"],
      longTail: [
        "ise giris muayenesi ne kadar",
        "periyodik muayene kac yilda bir",
        "isci saglik raporu nereden alinir",
        "saglik taramasi fiyati",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} ise giris muayenesi",
      "{sehir} periyodik muayene",
      "{ilce} saglik taramasi",
      "{sehir} isci saglik raporu",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "muayene_turleri",
      "testler_listesi",
      "gecerlilik_sureleri",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
      "Is Sagligi ve Guvenligi Hizmetleri Yonetmeligi",
    ],
  },

  // =========================================
  // BELGE VE DENETIM HIZMETLERI
  // =========================================
  {
    id: "acil-durum-plani",
    name: "Acil Durum Plani",
    slug: "acil-durum-plani",
    shortDescription: "Isyeri acil durum eylem plani hazirlama",
    keywords: {
      primary: ["acil durum plani", "acil eylem plani", "tahliye plani"],
      secondary: ["kriz yonetimi", "acil durum ekibi", "toplanma noktasi"],
      longTail: [
        "acil durum plani ornegi",
        "acil durum plani nasil hazirlanir",
        "acil durum plani zorunlu mu",
        "acil durum plani fiyati",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} acil durum plani",
      "{ilce} isyeri acil durum",
      "{sehir} tahliye plani",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "plan_icerigi",
      "ekip_olusturma",
      "tatbikat_bilgi",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "Isyerlerinde Acil Durumlar Hakkinda Yonetmelik",
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
    ],
  },
  {
    id: "isg-kurulu",
    name: "ISG Kurul Toplantilari",
    slug: "is-guvenligi-kurulu",
    shortDescription: "Is sagligi ve guvenligi kurul toplanti organizasyonu",
    keywords: {
      primary: ["isg kurulu", "is guvenligi kurulu", "kurul toplantisi"],
      secondary: ["kurul kararlari", "isci temsilcisi", "isveren temsilcisi"],
      longTail: [
        "isg kurulu kimlerden olusur",
        "isg kurulu zorunlu mu",
        "kac calisana kurul gerekir",
        "kurul toplanti tutanagi",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} isg kurulu",
      "{sehir} is guvenligi kurulu",
      "{ilce} kurul toplantisi",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "kurul_uyeleri",
      "toplanti_esaslari",
      "gorev_dagilimlari",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "Is Sagligi ve Guvenligi Kurullari Hakkinda Yonetmelik",
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
    ],
  },
  {
    id: "onayli-defter",
    name: "Onayli Defter Islemleri",
    slug: "onayli-defter",
    shortDescription: "Isyeri saglik ve guvenlik birimi defteri tutma",
    keywords: {
      primary: ["onayli defter", "isg defteri", "isyeri defteri"],
      secondary: ["defter onaylama", "defter tutma", "kayit defteri"],
      longTail: [
        "onayli defter nasil alinir",
        "onayli defter nereye onaylatilir",
        "onayli defter zorunlu mu",
        "onayli defter fiyati",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} onayli defter",
      "{sehir} isg defteri",
      "{ilce} isyeri defteri",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "defter_turleri",
      "kayit_gereksinimleri",
      "onaylama_sureci",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "Is Sagligi ve Guvenligi Hizmetleri Yonetmeligi",
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
    ],
  },

  // =========================================
  // ENTEGRASYON HIZMETLERI
  // =========================================
  {
    id: "isg-katip",
    name: "ISG-KATIP Islemleri",
    slug: "isg-katip",
    shortDescription: "ISG-KATIP sistemi uzerinden bildirim ve takip",
    keywords: {
      primary: ["isg katip", "isgkatip", "katip sistemi"],
      secondary: ["katip bildirimi", "osgb katip", "bakanlık bildirimi"],
      longTail: [
        "isg katip nasil kullanilir",
        "isg katip sifresi nasil alinir",
        "katip bildirimi nasil yapilir",
        "katip sistemi giris",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} isg katip",
      "{sehir} katip bildirimi",
      "{ilce} osgb katip",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "sistem_tanitimi",
      "bildirim_turleri",
      "surec_adimlari",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "Is Sagligi ve Guvenligi Hizmetleri Yonetmeligi",
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
      "23 Aralik 2025 Tarihli Digital Sozlesme Yonetmeligi",
    ],
  },
  {
    id: "isg-ceza-danismanligi",
    name: "İSG Ceza ve Mevzuat Danismanligi",
    slug: "isg-ceza-danismanligi",
    shortDescription: "2026 guncel İSG cezalari ve yasal uyum danismanligi",
    keywords: {
      primary: ["isg cezalari 2026", "is guvenligi cezasi", "isg mevzuat danismanligi"],
      secondary: ["6331 sayili kanun cezalar", "isyeri hekimi calistirmama cezasi", "isg para cezalari"],
      longTail: [
        "2026 isg idari para cezalari listesi",
        "is guvenligi uzmani calistirmama cezasi 2026",
        "risk analizi yaptirmama cezası ne kadar",
        "isg cezasindan nasil kurtulunur",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} isg ceza danismanligi",
      "{sehir} is guvenligi mevzuat yardimi",
      "{ilce} isg cezalarindan korunma",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "ceza_listesi_2026",
      "yasal_sorun_cozumu",
      "risk_analizi_onemi",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "6331 sayili Is Sagligi ve Guvenligi Kanunu",
      "2026 Yeniden Degerleme Orani Karari",
    ],
  },
  {
    id: "periyodik-kontrol-akreditasyon",
    name: "Akredite Periyodik Kontrol",
    slug: "akredite-periyodik-kontrol",
    shortDescription: "TÜRKAK akredite 8 ana ekipman grubu periyodik kontrolu",
    keywords: {
      primary: ["akredite periyodik kontrol", "is ekipmanlari muayene", "turkak onayli kontrol"],
      secondary: ["buhar kazani periyodik kontrol", "kule vinc muayene", "asansor kontrol"],
      longTail: [
        "akredite periyodik kontrol zorunlulugu 2026",
        "buhar kazani periyodik kontrol fiyati",
        "hangi ekipmanlar akredite kontrol edilmeli",
        "isg katip periyodik kontrol sozlesmesi",
      ],
    },
    locationKeywordPatterns: [
      "{sehir} akredite periyodik kontrol",
      "{ilce} periyodik muayene servisi",
      "{sehir} turkak onayli muayene",
    ],
    requiredSections: [
      "hero",
      "hizmet_tanimi",
      "akreditasyon_onemi",
      "ekipman_listesi",
      "isg_katip_sozlesme",
      "fiyatlandirma_bilgi",
      "sss",
      "iletisim_cta",
    ],
    legalReferences: [
      "Is Ekipmanlarinin Kullaniminda Saglik ve Guvenlik Sartlari Yonetmeligi",
      "TURKAK Muayene Kurulusu Akreditasyon Standartlari",
    ],
  },
];

/**
 * Hizmet ID'sine gore hizmet bul
 */
export function getServiceById(id: string): OsgbService | undefined {
  return OSGB_SERVICES.find((s) => s.id === id);
}

/**
 * Hizmet slug'ina gore hizmet bul
 */
export function getServiceBySlug(slug: string): OsgbService | undefined {
  return OSGB_SERVICES.find((s) => s.slug === slug);
}

/**
 * Tum hizmetleri getir
 */
export function getAllServices(): OsgbService[] {
  return OSGB_SERVICES;
}

/**
 * Zorunlu hizmetleri getir (Ana SEO hedefi)
 */
export function getMandatoryServices(): OsgbService[] {
  const mandatoryIds = [
    "isyeri-hekimi",
    "is-guvenligi-uzmani",
    "risk-analizi",
    "isg-egitimi",
  ];
  return OSGB_SERVICES.filter((s) => mandatoryIds.includes(s.id));
}

/**
 * Payload CMS'den tum hizmetleri getir
 */
export async function getAllServicesFromCMS(): Promise<OsgbService[]> {
  try {
    const { getPayloadInstance } = await import('@/lib/payload');
    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'services',
      limit: 100,
    });

    return result.docs.map(doc => ({
      id: String(doc.id),
      name: doc.name,
      slug: doc.slug,
      shortDescription: doc.shortDescription,
      keywords: {
        primary: (doc.keywords as any)?.primary || [],
        secondary: (doc.keywords as any)?.secondary || [],
        longTail: (doc.keywords as any)?.longTail || [],
      },
      locationKeywordPatterns: doc.locationKeywordPatterns || [],
      requiredSections: doc.requiredSections || [],
      targetSectors: doc.targetSectors || [],
      legalReferences: doc.legalReferences || [],
    }));
  } catch (error) {
    console.warn('Payload Services fetch failed, falling back to hardcoded list:', error);
    return OSGB_SERVICES;
  }
}

/**
 * Slug'a gore hizmet getir (CMS Oncelikli)
 */
export async function getServiceBySlugFromCMS(slug: string): Promise<OsgbService | undefined> {
  try {
    const { getPayloadInstance } = await import('@/lib/payload');
    const payload = await getPayloadInstance();
    const result = await payload.find({
      collection: 'services',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    });

    if (result.docs.length === 0) return getServiceBySlug(slug);

    const doc = result.docs[0];
    return {
      id: String(doc.id),
      name: doc.name,
      slug: doc.slug,
      shortDescription: doc.shortDescription,
      keywords: {
        primary: (doc.keywords as any)?.primary || [],
        secondary: (doc.keywords as any)?.secondary || [],
        longTail: (doc.keywords as any)?.longTail || [],
      },
      locationKeywordPatterns: doc.locationKeywordPatterns || [],
      requiredSections: doc.requiredSections || [],
      targetSectors: doc.targetSectors || [],
      legalReferences: doc.legalReferences || [],
    };
  } catch (error) {
    return getServiceBySlug(slug);
  }
}

/**
 * Lokasyon bazli keyword olustur
 */
export function generateLocationKeywords(
  service: OsgbService,
  provinceName: string,
  districtName?: string
): string[] {
  const keywords: string[] = [];

  for (const pattern of service.locationKeywordPatterns) {
    let keyword = pattern.replace("{sehir}", provinceName.toLowerCase());

    if (districtName) {
      keyword = keyword.replace("{ilce}", districtName.toLowerCase());
    } else {
      // Ilce yoksa, ilce pattern'lerini atla
      if (keyword.includes("{ilce}")) continue;
    }

    // Sektor varsa genel birak (daha sonra sektor bazli generate edilecek)
    if (keyword.includes("{sektor}")) continue;

    keywords.push(keyword);
  }

  return keywords;
}

/**
 * Sayfa basligini olustur
 */
export function generatePageTitle(
  service: OsgbService,
  provinceName: string,
  districtName?: string,
  companyName?: string
): string {
  const location = districtName
    ? `${districtName}, ${provinceName}`
    : provinceName;

  const suffix = companyName ? ` | ${companyName}` : "";

  return `${location} ${service.name}${suffix}`;
}

/**
 * Meta description olustur
 */
export function generateMetaDescription(
  service: OsgbService,
  provinceName: string,
  districtName?: string
): string {
  const location = districtName
    ? `${districtName} ve ${provinceName}`
    : provinceName;

  return `${location} bolgesinde profesyonel ${service.name.toLowerCase()} hizmeti. ${service.shortDescription}. Hemen teklif alin!`;
}
