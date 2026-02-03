/**
 * OSGB Local SEO Content Templates
 *
 * Lokasyon bazli sayfalarin icerik sablonlari
 * Her hizmet icin ozel icerik yapisI
 */

import { Province, District, getProvinceById } from "./turkey-geo-data";
import { OsgbService, getServiceById } from "./osgb-services";

// ============================================
// TEMPLATE TYPES
// ============================================

export interface ContentTemplate {
  serviceId: string;
  sections: TemplateSectionDef[];
}

export interface TemplateSectionDef {
  id: string;
  title: string;
  template: string;
  variables: string[];
  optional?: boolean;
}

export interface RenderedContent {
  html: string;
  plainText: string;
  wordCount: number;
  headings: { level: number; text: string }[];
}

// ============================================
// TEMPLATE VARIABLES
// ============================================

export interface TemplateVariables {
  // Location
  sehir: string;
  sehir_kucuk: string;
  ilce?: string;
  ilce_kucuk?: string;
  bolge: string;
  komsu_iller: string;

  // Service
  hizmet: string;
  hizmet_kucuk: string;
  hizmet_aciklama: string;

  // Company
  firma?: string;
  telefon?: string;
  email?: string;

  // Dynamic
  yil: number;
  gun: string;
}

/**
 * Template degiskenlerini hazirla
 */
export function prepareVariables(
  province: Province,
  service: OsgbService,
  district?: District,
  options?: {
    companyName?: string;
    phone?: string;
    email?: string;
  }
): TemplateVariables {
  const neighbors = province.neighbors
    .map((id) => getProvinceById(id)?.name)
    .filter(Boolean)
    .join(", ");

  const now = new Date();
  const days = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

  return {
    sehir: province.name,
    sehir_kucuk: province.name.toLowerCase(),
    ilce: district?.name,
    ilce_kucuk: district?.name?.toLowerCase(),
    bolge: district ? `${district.name}, ${province.name}` : province.name,
    komsu_iller: neighbors || "cevre iller",

    hizmet: service.name,
    hizmet_kucuk: service.name.toLowerCase(),
    hizmet_aciklama: service.shortDescription,

    firma: options?.companyName,
    telefon: options?.phone,
    email: options?.email,

    yil: now.getFullYear(),
    gun: days[now.getDay()],
  };
}

/**
 * Template'i render et
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let result = template;

  // {{degisken}} formatindaki tum degiskenleri degistir
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, String(value));
    }
  }

  // Kullanilmayan degiskenleri temizle
  result = result.replace(/{{[^}]+}}/g, "");

  return result;
}

// ============================================
// SERVICE SPECIFIC TEMPLATES
// ============================================

/**
 * Isyeri Hekimi sayfa sablonu
 */
export const ISYERI_HEKIMI_TEMPLATE: ContentTemplate = {
  serviceId: "isyeri-hekimi",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Isyeri Hekimligi Hizmeti

{{bolge}} bolgesinde profesyonel **isyeri hekimligi** hizmeti sunuyoruz.
6331 sayili Is Sagligi ve Guvenligi Kanunu kapsaminda tum yasal gereksinimleri karsiliyoruz.

[Ucretsiz Teklif Alin](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da Isyeri Hekimi Ne Yapar?

Isyeri hekimi, isyerinde calisanlarin sagligini korumak ve gelistirmek amaciyla gorev yapan is sagligi uzmanidir.

### Isyeri Hekiminin Gorevleri

- **Ise Giris Muayenesi**: Yeni ise alinan calisanlarin saglik kontrolu
- **Periyodik Muayene**: Duzgun araliklarla calisan saglik takibi
- **Is Kazasi Takibi**: Kaza sonrasi saglik degerlendirmesi
- **Meslek Hastaligi Tespiti**: Ise bagli hastaliklarin onlenmesi
- **Saglik Gozetimi**: Calisanlarin genel saglik durumunun izlenmesi
- **Saglik Egitimi**: Calisanlara saglik konusunda bilgilendirme

{{sehir}} ve {{komsu_iller}} bolgesinde bu hizmetlerin tamamini sunuyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "yasal_zorunluluk",
      title: "Yasal Zorunluluk",
      template: `
## Isyeri Hekimi Zorunlu mu?

Evet, **6331 sayili Is Sagligi ve Guvenligi Kanunu**'na gore belirli sartlari tasiyan tum isyerleri isyeri hekimi calistirmak zorundadir.

### Tehlike Sinifina Gore Zorunluluk

| Tehlike Sinifi | Calisan Sayisi | Isyeri Hekimi Suresi |
|----------------|----------------|----------------------|
| Az Tehlikeli | 50+ calisan | Ayda en az X dakika/calisan |
| Tehlikeli | 50+ calisan | Ayda en az Y dakika/calisan |
| Cok Tehlikeli | Tum calisanlar | Ayda en az Z dakika/calisan |

### {{yil}} Yilinda Isyeri Hekimi Bulundurmama Cezasi

- **Ilk ihlal**: 5.000 - 10.000 TL idari para cezasi
- **Tekrar ihlal**: Cezalar katlanarak artar
- **Is kazasi durumunda**: Cezai sorumluluk ve tazminat

> {{sehir}}'da isletmenizin tehlike sinifini ogrenmek ve yasal yukumlulugunuzu belirlemek icin bizi arayin.
      `.trim(),
      variables: ["yil", "sehir"],
    },
    {
      id: "hizmet_kapsami",
      title: "Hizmet Bolgelerimiz",
      template: `
## {{sehir}}'da Isyeri Hekimi Hizmeti Verdigimiz Bolgeler

**{{sehir}}** merkezinden baslayarak asagidaki bolgelere isyeri hekimligi hizmeti veriyoruz:

### {{sehir}} Ilceleri
Tum {{sehir}} ilcelerine hizmet vermekteyiz. Merkez ilcelerimize ayni gun, dis ilcelere 24 saat icinde ulasim saglanmaktadir.

### Komsu Iller
- {{komsu_iller}}

Bolgesel avantajimiz sayesinde **hizli mudahale** ve **uygun fiyat** garantisi sunuyoruz.
      `.trim(),
      variables: ["sehir", "komsu_iller"],
    },
    {
      id: "fiyatlandirma",
      title: "Fiyatlandirma",
      template: `
## {{sehir}} Isyeri Hekimi Fiyatlari {{yil}}

Isyeri hekimi fiyatlari asagidaki faktorlere gore belirlenir:

- Isyerinin **tehlike sinifi**
- **Calisan sayisi**
- Isyerinin **konumu**
- Talep edilen **ek hizmetler**

### Neden Bizi Tercih Etmelisiniz?

1. **Seffaf Fiyatlandirma**: Gizli maliyet yok
2. **Esnek Odeme**: Aylik veya yillik odeme secenekleri
3. **Toplu Indirim**: Birden fazla hizmet alindiginda indirim
4. **Ucretsiz Keşif**: Fiyat teklifi icin ucretsiz isyeri ziyareti

{{bolge}} bolgesinde **ucretsiz keşif** ve fiyat teklifi almak icin bizi arayin.
      `.trim(),
      variables: ["sehir", "yil", "bolge"],
    },
    {
      id: "sss",
      title: "Sikca Sorulan Sorular",
      template: `
## {{sehir}} Isyeri Hekimi Hakkinda Sikca Sorulan Sorular

### Isyeri hekimi kac calisana gerekir?

Tehlike sinifina bagli olarak genellikle **50 ve uzeri calisan** sayisina ulasan isyerleri isyeri hekimi bulundurmak zorundadir. Ancak cok tehlikeli isyerlerinde bu sinir daha dusuktur.

### Isyeri hekimi ne siklikta gelmeli?

Tehlike sinifina ve calisan sayisina gore degisir:
- Az tehlikeli: Ayda X dakika/calisan
- Tehlikeli: Ayda Y dakika/calisan
- Cok tehlikeli: Ayda Z dakika/calisan

### {{sehir}}'da isyeri hekimi fiyati ne kadar?

Fiyatlar isyeri buyuklugu ve tehlike sinifina gore degisir. **Ucretsiz keşif** ile size ozel fiyat teklifi sunuyoruz.

### Isyeri hekimi yerine OSGB'den hizmet alabilir miyim?

Evet, kendi hekiminizi istihdam etmek yerine bizim gibi yetkili bir **OSGB**'den hizmet alabilirsiniz. Bu genellikle daha ekonomiktir.

### Isyeri hekimi olmadan is kazasi olursa ne olur?

Isyeri hekimi olmadan calisirken is kazasi meydana gelirse, isveren agir cezai ve mali sorumluluk altina girer. **SGK rucu davasi** ve **ceza davasi** riski vardir.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "Iletisim CTA",
      template: `
## {{bolge}}'da Isyeri Hekimi Icin Hemen Bizi Arayin

{{firma}} olarak {{sehir}} ve cevresinde profesyonel isyeri hekimligi hizmeti sunuyoruz.

### Neden Beklemeyin?

- Yasal yukumluluklerinizi yerine getirin
- Is kazasi ve meslek hastaligi riskini azaltin
- Calisanlarinizin sagligini koruyun
- Olasi cezalardan kacinin

**Ucretsiz keşif ve fiyat teklifi icin:**

📞 [{{telefon}}](tel:{{telefon}})
📧 [{{email}}](mailto:{{email}})

veya asagidaki formu doldurun, **24 saat icinde** size donelim.
      `.trim(),
      variables: ["bolge", "firma", "sehir", "telefon", "email"],
    },
  ],
};

/**
 * Is Guvenligi Uzmani sayfa sablonu
 */
export const IS_GUVENLIGI_UZMANI_TEMPLATE: ContentTemplate = {
  serviceId: "is-guvenligi-uzmani",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Is Guvenligi Uzmani

{{bolge}} bolgesinde **A, B ve C sinifi** is guvenligi uzmanligi hizmeti.
Isyerinizin tehlike sinifina uygun uzman destegi sunuyoruz.

[Teklif Alin](#iletisim) | [Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "uzman_siniflari",
      title: "Uzman Siniflari",
      template: `
## Is Guvenligi Uzmani Siniflari

Is guvenligi uzmanlari A, B ve C olmak uzere uc sinifa ayrilir. Hangi sinif uzman gerektigini **isyerinizin tehlike sinifi** belirler.

### A Sinifi Is Guvenligi Uzmani
- **Cok tehlikeli** isyerlerinde gorev yapar
- En yuksek yetkinlik seviyesi
- Maden, kimya, insaat gibi sektorler

### B Sinifi Is Guvenligi Uzmani
- **Tehlikeli** isyerlerinde gorev yapar
- Orta seviye yetkinlik
- Uretim, tekstil, gida gibi sektorler

### C Sinifi Is Guvenligi Uzmani
- **Az tehlikeli** isyerlerinde gorev yapar
- Temel yetkinlik seviyesi
- Ofis, perakende, hizmet sektoru

{{sehir}}'da her uc sinifta da uzman kadromuzla hizmet veriyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "tehlike_siniflari",
      title: "Tehlike Siniflari",
      template: `
## Isyerinizin Tehlike Sinifi Nedir?

Isyerlerinin tehlike siniflari **NACE koduna** gore belirlenir.

### Az Tehlikeli Isyerleri
- Ofisler, bankalar
- Perakende magazalar
- Egitim kurumlari
- Hizmet sektoru

### Tehlikeli Isyerleri
- Uretim tesisleri
- Gida isletmeleri
- Tekstil fabrikalari
- Depolama tesisleri

### Cok Tehlikeli Isyerleri
- Maden ocaklari
- Insaat santiyeleri
- Kimya fabrikalari
- Metal isleme tesisleri

> {{sehir}}'da isyerinizin tehlike sinifini **ucretsiz** olarak belirliyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "gorevler",
      title: "Gorev ve Yetkiler",
      template: `
## Is Guvenligi Uzmaninin Gorevleri

### Risk Degerlendirmesi
- Isyerindeki tehlikelerin tespiti
- Risk puanlama ve onceliklendirme
- Onlem onerilerinin hazirlanmasi

### Egitim ve Bilgilendirme
- Calisan ISG egitimleri
- Acil durum tatbikatlari
- Guvenlik bilgilendirmeleri

### Denetim ve Takip
- Periyodik isyeri denetimleri
- Onlemlerin takibi
- Uygunsuzluk raporlama

### Dokumantasyon
- Risk analizi raporu
- Acil durum plani
- ISG prosedurlerinin hazirlanmasi

{{bolge}} bolgesinde tum bu hizmetleri kapsamli sekilde sunuyoruz.
      `.trim(),
      variables: ["bolge"],
    },
    {
      id: "fiyatlandirma",
      title: "Fiyatlandirma",
      template: `
## {{sehir}} Is Guvenligi Uzmani Fiyatlari {{yil}}

| Tehlike Sinifi | Uzman Sinifi | Aylik Fiyat Araligi |
|----------------|--------------|---------------------|
| Az Tehlikeli | C Sinifi | Uygun |
| Tehlikeli | B Sinifi | Orta |
| Cok Tehlikeli | A Sinifi | Premium |

### Fiyati Etkileyen Faktorler

- Calisan sayisi
- Isyeri lokasyonu
- Ziyaret sikligi
- Ek hizmetler (egitim, dokumantasyon)

**{{sehir}}'da ucretsiz keşif** ile isyerinize ozel fiyat teklifi alin.
      `.trim(),
      variables: ["sehir", "yil"],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} Is Guvenligi Uzmani SSS

### Hangi sinif uzman gerekir?

Isyerinizin **tehlike sinifina** gore:
- Az tehlikeli → C Sinifi
- Tehlikeli → B Sinifi
- Cok tehlikeli → A Sinifi

### Is guvenligi uzmani ne siklikta gelmeli?

Calisan sayisi ve tehlike sinifina gore aylik sure belirlenir. Genellikle:
- Az tehlikeli: Ayda 10 dk/calisan
- Tehlikeli: Ayda 15 dk/calisan
- Cok tehlikeli: Ayda 20 dk/calisan

### Uzman yerine OSGB'den hizmet alabilir miyim?

Evet, tam zamanli uzman istihdam etmek yerine OSGB'den dis kaynak hizmeti alabilirsiniz. Bu genellikle **daha ekonomik** ve **daha pratik** bir cozumdur.

### {{sehir}}'da is guvenligi uzmani nasil bulurum?

{{sehir}} bolgesinde yetkili OSGB olarak A, B ve C sinifi is guvenligi uzmanligi hizmeti veriyoruz. Hemen bizi arayin.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da Is Guvenligi Uzmani Icin Bizi Arayin

- ✅ A, B, C sinifi uzman kadrosu
- ✅ {{sehir}} ve {{komsu_iller}} hizmet alani
- ✅ Rekabetci fiyatlar
- ✅ Hizli baslangic

📞 **{{telefon}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon"],
    },
  ],
};

/**
 * Risk Analizi sayfa sablonu
 */
export const RISK_ANALIZI_TEMPLATE: ContentTemplate = {
  serviceId: "risk-analizi",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Risk Analizi ve Degerlendirmesi

{{bolge}} bolgesinde profesyonel **risk degerlendirmesi** hizmeti.
6331 sayili Kanun kapsaminda zorunlu risk analizi hazirliyoruz.

[Teklif Alin](#iletisim)
      `.trim(),
      variables: ["bolge"],
    },
    {
      id: "risk_tanimi",
      title: "Risk Analizi Nedir",
      template: `
## Risk Analizi Nedir?

Risk analizi (risk degerlendirmesi), isyerindeki tehlikelerin belirlenmesi ve bu tehlikelerden kaynaklanabilecek risklerin degerlendirilmesi surecidir.

### Risk Analizi Neden Onemli?

1. **Yasal Zorunluluk**: 6331 sayili Kanun geregi tum isyerleri risk analizi yapmak zorunda
2. **Is Kazalarini Onleme**: Tehlikeleri onceden tespit ederek kazalari onler
3. **Mali Koruma**: Is kazasi tazminatlari ve cezalardan korur
4. **Calisan Guvenligii**: Calisanlarin guvenli bir ortamda calismasini saglar

{{sehir}} bolgesinde isletmeniz icin kapsamli risk analizi hazirliyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "metodoloji",
      title: "Metodoloji",
      template: `
## Risk Degerlendirmesi Nasil Yapilir?

### 1. Tehlike Tanimlama
- Isyeri gezisi ve gozlem
- Calisan gorusmeleri
- Makine ve ekipman incelemesi
- Kimyasal madde envanteri

### 2. Risk Belirleme
- Her tehlike icin risk puanlama
- Olasilik x Siddet matrisi
- Onceliklendirme

### 3. Onlem Planlama
- Mevcut onlemlerin degerlendirmesi
- Ek onlem onerileri
- Sorumluluk atama
- Termin belirleme

### 4. Dokumantasyon
- Risk analizi raporu
- Aksiyon plani
- Takip formlari

{{sehir}}'da uzman ekibimizle bu sureci profesyonelce yonetiyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "sektor_bazli",
      title: "Sektor Bazli Risk Analizi",
      template: `
## Sektore Ozel Risk Analizi

Her sektorun kendine ozgu riskleri vardir. {{sehir}} bolgesinde asagidaki sektorlere ozel risk analizi yapiyoruz:

### Insaat Sektoru
- Yuksekte calisma riskleri
- Iskele guvenligi
- Elektrik carpmasi
- Malzeme dusmes

### Uretim / Fabrika
- Makine guvenligi
- Kimyasal maddeler
- Gurultu maruziyeti
- Ergonomik riskler

### Depo / Lojistik
- Forklift guvenligi
- Raf sistemleri
- Yukleme bosaltma
- Trafik duzeni

### Ofis / Hizmet
- Ergonomi
- Elektrik guvenligi
- Yangin riski
- Psikososyal riskler
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} Risk Analizi Sikca Sorulan Sorular

### Risk analizi zorunlu mu?

**Evet**, 6331 sayili Kanun'un 10. maddesi geregi tum isverenler risk degerlendirmesi yapmak zorundadir.

### Risk analizi kac yilda bir yenilenmeli?

- **Az tehlikeli** isyerleri: 6 yilda bir
- **Tehlikeli** isyerleri: 4 yilda bir
- **Cok tehlikeli** isyerleri: 2 yilda bir

Ayrica is kazasi, degisiklik veya yeni tehlike durumunda yenilenmeli.

### Risk analizi ucreti ne kadar?

{{sehir}}'da risk analizi ucreti isyeri buyuklugu, sektor ve tehlike sinifina gore degisir. **Ucretsiz keşif** ile size ozel fiyat veriyoruz.

### Risk analizi yapmamamin cezasi nedir?

{{yil}} yilinda risk analizi yapmayan isverenler **5.000 TL ve uzeri** idari para cezasi ile karsilasir. Is kazasi durumunda ceza katlanir.
      `.trim(),
      variables: ["sehir", "yil"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da Risk Analizi Yaptirin

- ✅ Uzman muhendis kadrosu
- ✅ Sektore ozel analiz
- ✅ Detayli raporlama
- ✅ Aksiyon takibi

📞 **{{telefon}}** - Ucretsiz keşif icin arayin
      `.trim(),
      variables: ["bolge", "telefon"],
    },
  ],
};

// ============================================
// ISG EGITIMI TEMPLATE
// ============================================

export const ISG_EGITIMI_TEMPLATE: ContentTemplate = {
  serviceId: "isg-egitimi",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Is Sagligi ve Guvenligi Egitimi

{{bolge}} bolgesinde **is sagligi ve guvenligi egitimi** hizmeti sunuyoruz.
6331 sayili Kanun kapsaminda zorunlu ISG egitimlerinizi eksiksiz tamamlayin.

[Egitim Teklifi Alin](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da ISG Egitimi Nedir?

Is Sagligi ve Guvenligi egitimi, calisanlarin is kazalari ve meslek hastaliklarindan korunmasi icin zorunlu olan bilgilendirme programidir.

### Egitim Kapsamimiz

- **Temel ISG Egitimi**: Tum calisanlar icin zorunlu genel egitim
- **Isbasi Egitimi**: Yeni ise baslayanlar ve is degisikligi yapanlar icin
- **Periyodik Egitim**: Belirli araliklarla tekrarlanan yenileme egitimi
- **Ozel Risk Egitimi**: Tehlikeli isler icin ek egitimler
- **Yonetici Egitimi**: Isveren ve yonetici sorumluluklari

{{sehir}} ve {{komsu_iller}} bolgesinde tum egitim turlerini isyerinizde veya online olarak veriyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "egitim_turleri",
      title: "Egitim Turleri ve Sureleri",
      template: `
## ISG Egitim Turleri ve Sureleri

Tehlike sinifina gore egitim sureleri degisir:

| Tehlike Sinifi | Temel Egitim | Yenileme Periyodu |
|----------------|-------------|-------------------|
| Az Tehlikeli | En az 8 saat | 3 yilda bir |
| Tehlikeli | En az 12 saat | 2 yilda bir |
| Cok Tehlikeli | En az 16 saat | Yilda bir |

### Egitim Konulari

1. **Genel ISG Bilgisi**: Is sagligi ve guvenligi mevzuati
2. **Risk ve Tehlikeler**: Isyerine ozel riskler ve onlemler
3. **Acil Durum**: Yangin, deprem, ilkyardim prosedürleri
4. **KKD Kullanimi**: Kisisel koruyucu donanim kullanimi
5. **Ergonomi**: Dogru calisma pozisyonlari
6. **Kimyasal Guvenlik**: Kimyasal maddelerle calisma

> {{sehir}}'da isyerinizin tehlike sinifina uygun egitim programi icin bizi arayin.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "egitim_metodolojisi",
      title: "Egitim Metodolojisi",
      template: `
## Egitim Metodolojimiz

### Yuzyuze Egitim
- Isyerinizde veya egitim salonumuzda
- Uygulamali ve interaktif
- Gercek vaka calismalar

### Online Egitim
- Canli webinar formatinda
- Kayit altina alinan dersler
- Online sinav ve sertifika

### Karma (Blended) Egitim
- Teorik kisim online
- Uygulamali kisim yuzyuze
- En verimli ogrenme modeli

{{bolge}} bolgesindeki isletmelere esnek egitim secenekleri sunuyoruz.
      `.trim(),
      variables: ["bolge"],
    },
    {
      id: "sertifika_bilgi",
      title: "Sertifika Bilgisi",
      template: `
## ISG Egitim Sertifikasi

Egitim sonunda calisanlara **ISG Egitim Sertifikasi** verilir. Bu sertifika:

- Calisanin adi, soyadi ve TC kimlik numarasi
- Egitim konulari ve sureleri
- Egitimi veren kurulusun bilgileri
- Sinav sonucu

Sertifikalar **ISG-KATIP** sistemine kayit edilir ve denetimde ibraz edilebilir.

> {{yil}} yilinda egitimsiz calisan calistirmak idari para cezasi gerektirir.
      `.trim(),
      variables: ["yil"],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} ISG Egitimi Sikca Sorulan Sorular

### ISG egitimi zorunlu mu?

**Evet**, 6331 sayili Kanun geregi tum isverenler calisanlarina ISG egitimi vermek zorundadir. Egitim verilmeden calisan calistirilamaz.

### ISG egitimi kac saat surmeli?

Tehlike sinifina gore: az tehlikeli 8 saat, tehlikeli 12 saat, cok tehlikeli 16 saat minimum egitim gereklidir.

### ISG egitimi online verilebilir mi?

Evet, uzaktan egitim yonetmeligine uygun olarak online ISG egitimi verilebilir. Ancak uygulamali egitimler yuzyuze yapilmalidir.

### {{sehir}}'da ISG egitimi ucreti ne kadar?

Calisan sayisi, tehlike sinifi ve egitim formatina gore degisir. **Toplu egitim indirimi** icin bizi arayin.

### Egitim almayan calisanin cezasi nedir?

{{yil}} yilinda egitimsiz calisan calistiran isverenler her calisan icin **idari para cezasi** odemek zorundadir.
      `.trim(),
      variables: ["sehir", "yil"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da ISG Egitimi Icin Hemen Arayin

{{firma}} olarak {{sehir}} ve cevresinde profesyonel ISG egitimi hizmeti sunuyoruz.

- Isyerinizde veya online egitim secenekleri
- Tehlike sinifina uygun egitim programlari
- ISG-KATIP kaydi ve sertifika
- Rekabetci fiyatlar ve toplu indirim

📞 **{{telefon}}** | 📧 **{{email}}**
      `.trim(),
      variables: ["bolge", "firma", "sehir", "telefon", "email"],
    },
  ],
};

// ============================================
// ILKYARDIM EGITIMI TEMPLATE
// ============================================

export const ILKYARDIM_EGITIMI_TEMPLATE: ContentTemplate = {
  serviceId: "ilkyardim-egitimi",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Ilkyardim Egitimi

{{bolge}} bolgesinde **sertifikali ilkyardim egitimi** hizmeti.
Isyerinizde yasal zorunlulugu karsilayin, calisanlarinizi hayat kurtaracak bilgilerle donatin.

[Egitim Talebi](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da Ilkyardim Egitimi

Ilkyardim egitimi, is kazasi veya ani rahatsizlik durumunda calisanlarin dogru mudahale yapabilmesi icin verilen zorunlu egitimdir.

### Egitim Icerigimiz

- **Temel Yasam Destegi (TYD)**: Kalp masaji ve suni solunum
- **Kanama Kontrolu**: Yara bakim ve sargı teknikleri
- **Kirik-Cikik Mudahalesi**: Atelleme ve tespit
- **Yanık Mudahalesi**: Ilk muüdahale adimlari
- **Zehirlenme**: Kimyasal ve gida zehirlenmesi
- **Bilinc Kaybı**: Koma pozisyonu ve takip

{{sehir}} ve {{komsu_iller}} bolgesinde uygulamali ilkyardim egitimi veriyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "kimler_olmali",
      title: "Kimler Ilkyardimci Olmali",
      template: `
## Isyerinde Kac Ilkyardimci Olmali?

Ilkyardim Yonetmeligi'ne gore her isyerinde belirli sayida sertifikali ilkyardimci bulunmalidir:

| Tehlike Sinifi | Ilkyardimci Orani |
|----------------|-------------------|
| Az Tehlikeli | Her 20 calisana 1 ilkyardimci |
| Tehlikeli | Her 15 calisana 1 ilkyardimci |
| Cok Tehlikeli | Her 10 calisana 1 ilkyardimci |

### Ornek Hesaplama

- 50 calisanli az tehlikeli isyeri → en az **3 ilkyardimci**
- 100 calisanli tehlikeli isyeri → en az **7 ilkyardimci**
- 30 calisanli cok tehlikeli isyeri → en az **3 ilkyardimci**

> {{sehir}}'da isyeriniz icin gerekli ilkyardimci sayisini ucretsiz hesapliyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "sertifika_bilgi",
      title: "Sertifika Bilgisi",
      template: `
## Ilkyardim Sertifikasi

### Sertifika Gecerlilik Suresi

Ilkyardim sertifikasi **3 yil** gecerlidir. Sure dolmadan yenileme egitimi alinmalidir.

### Sertifika Sureci

1. **16 saatlik egitim** programina katilim
2. Teorik ve uygulamali **sinav**
3. Basarili olanlara **Saglik Bakanligi onayli** sertifika
4. Sertifika ISG-KATIP'e kayit edilir

### Egitim Programi

- 1. Gun (8 saat): Teorik bilgi + temel uygulamalar
- 2. Gun (8 saat): Ileri uygulamalar + sinav

Egitimlerimiz **Saglik Bakanligi yetkili egitim merkezi** onayli olarak verilmektedir.
      `.trim(),
      variables: [],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} Ilkyardim Egitimi Sikca Sorulan Sorular

### Ilkyardim egitimi zorunlu mu?

**Evet**, Ilkyardim Yonetmeligi geregi her isyerinde sertifikali ilkyardimci bulunmak zorundadir.

### Ilkyardim egitimi kac saat surer?

Standart ilkyardim egitimi toplam **16 saat** surer ve 2 gunde tamamlanir.

### Ilkyardim sertifikasi kac yil gecerli?

Ilkyardim sertifikasi **3 yil** gecerlidir. Sure dolmadan yenileme egitimi alinmalidir.

### {{sehir}}'da ilkyardim egitimi ucreti ne kadar?

Kisi sayisina gore degisir. Toplu gruplarda **ozel fiyat** uyguluyoruz. Ucretsiz teklif icin bizi arayin.

### Online ilkyardim egitimi gecerli mi?

Ilkyardim egitiminin uygulamali kismi mutlaka **yuzyuze** yapilmalidir. Sadece teorik kisim online verilebilir.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da Ilkyardim Egitimi Icin Bizi Arayin

- Saglik Bakanligi onayli sertifika
- {{sehir}} ve {{komsu_iller}} bolgesi
- Isyerinizde veya egitim merkezimizde
- Toplu gruplara ozel fiyat

📞 **{{telefon}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon"],
    },
  ],
};

// ============================================
// YANGIN EGITIMI TEMPLATE
// ============================================

export const YANGIN_EGITIMI_TEMPLATE: ContentTemplate = {
  serviceId: "yangin-egitimi",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Yangin Egitimi ve Tatbikati

{{bolge}} bolgesinde **yangin egitimi ve tatbikati** hizmeti.
Calisanlarinizi yangin aninda dogru mudahale edebilecek bilgi ve beceriyle donatin.

[Tatbikat Planlayın](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da Yangin Egitimi

Yangin egitimi, isyerinde cikan veya cikmasi muhtemel yanginlara karsi calisanlarin bilinclenmesini ve dogru mudahale edebilmesini saglayan egitim programidir.

### Egitim Kapsamimiz

- **Yangin Turleri**: A, B, C, D, E sinifi yanginlar ve farklari
- **Sozdurme Teknikleri**: Yangin tupu, hortuml sistem, battaniye kullanimi
- **Tahliye Proseduru**: Bina tahliye plani ve toplanma noktalari
- **Yangin Tupu Kullanimi**: Uygulamali yangin tupu egitimi
- **Yangin Alarm Sistemi**: Alarm ve ihbar prosedürleri

{{sehir}} ve {{komsu_iller}} bolgesinde uygulamali yangin egitimi ve tatbikati duzenliyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "tatbikat_bilgi",
      title: "Tatbikat Bilgisi",
      template: `
## Yangin Tatbikati Nasil Yapilir?

### Tatbikat Adimlari

1. **Planlama**: Senaryo hazirlama, ekip belirleme
2. **Bilgilendirme**: Calisanlara tatbikat oncesi bilgi
3. **Alarm**: Yangin alarm sisteminin calistirilmasi
4. **Tahliye**: Bina bosaltma ve toplanma noktasina yonlendirme
5. **Sozdurme**: Kontrollü yangin sozdurme uygulamasi
6. **Sayim**: Personel sayimi ve eksik tespiti
7. **Degerlendirme**: Tatbikat raporu ve iyilestirme onerileri

### Tatbikat Periyodu

- **Yilda en az 1 kez** yangin tatbikati yapilmalidir
- Cok tehlikeli isyerlerinde **yilda 2 kez** onerilir
- Her tatbikat **kayit altina** alinmalidir

> {{sehir}}'da profesyonel yangin tatbikati organizasyonu icin bizi arayin.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "ekipman_tanitimi",
      title: "Ekipman Tanitimi",
      template: `
## Yanginla Mucadele Ekipmanlari

### Yangin Tupu Turleri

| Tur | Kullanim Alani | Sinif |
|-----|---------------|-------|
| Kuru Kimyevi Tozlu | Genel amacli | ABC |
| Karbondioksitli (CO2) | Elektrik yanginlari | BC |
| Kopuklu | Sivi yanginlari | AB |
| Sulu | Kati madde yanginlari | A |

### Diger Ekipmanlar

- **Yangin Dolabi**: Hortum ve lans sistemi
- **Yangin Battaniyesi**: Kucuk yangin ve kisi uzerindeki alevler
- **Duman Dedektoru**: Erken uyari sistemi
- **Acil Aydinlatma**: Tahliye yolu aydinlatmasi
- **Yangin Merdiveni**: Disaridan tahliye imkani

Egitimlerimizde tum ekipmanların uygulamali kullanimi gosterilmektedir.
      `.trim(),
      variables: [],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} Yangin Egitimi Sikca Sorulan Sorular

### Yangin egitimi zorunlu mu?

**Evet**, Binalarin Yangindan Korunmasi Hakkinda Yonetmelik geregi tum isyerlerinde yangin egitimi ve tatbikati yapilmalidir.

### Yangin tatbikati kac ayda bir yapilmali?

Yilda en az **1 kez** yangin tatbikati yapilmalidir. Cok tehlikeli isyerlerinde yilda 2 kez onerilir.

### Yangin tupu kac metrede bir olmali?

Genel kural olarak her **500 metrekare** icin en az 1 adet 6 kg'lik yangin tupu bulunmalidir. Yurume mesafesi 25 metreyi gecmemelidir.

### {{sehir}}'da yangin egitimi ucreti ne kadar?

Calisan sayisi ve tatbikat kapsamina gore degisir. **Ucretsiz keşif** ile fiyat teklifi veriyoruz.

### Yangin tupu kontrolu ne siklikta yapilmali?

Yangin tupleri **6 ayda bir** gorsel kontrol, **yilda bir** bakim ve **10 yilda bir** hidrostatik test yaptirmalidir.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da Yangin Egitimi ve Tatbikati

- Uygulamali yangin sozdurme egitimi
- Profesyonel tatbikat organizasyonu
- {{sehir}} ve {{komsu_iller}} hizmet bolgemiz
- Detayli tatbikat raporu

📞 **{{telefon}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon"],
    },
  ],
};

// ============================================
// SAGLIK TARAMASI TEMPLATE
// ============================================

export const SAGLIK_TARAMASI_TEMPLATE: ContentTemplate = {
  serviceId: "saglik-taramasi",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Ise Giris ve Periyodik Muayene

{{bolge}} bolgesinde **ise giris muayenesi ve periyodik saglik taramasi** hizmeti.
Calisanlarinizin saglik gozetimini eksiksiz yapiyoruz.

[Randevu Alin](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da Saglik Taramasi Hizmeti

Isyeri saglik taramasi, calisanlarin ise girisinde ve calisma surecinde duzgun araliklarla saglik durumlarinin degerlendirilmesidir.

### Muayene Turlerimiz

- **Ise Giris Muayenesi**: Yeni ise alinan her calisan icin zorunlu
- **Periyodik Muayene**: Belirli araliklarla tekrarlanan saglik kontrolu
- **Is Degisikligi Muayenesi**: Farkli isle gorevlendirmelerde
- **Ise Donus Muayenesi**: Uzun sureli raporlu donus sonrasi
- **Iscilik Muayenesi**: Ozel saglik sartlari gerektiren isler icin

{{sehir}} ve {{komsu_iller}} bolgesinde isyerinizde veya merkezimizde muayene hizmeti veriyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "testler_listesi",
      title: "Testler ve Tetkikler",
      template: `
## Saglik Taramasi Kapsamindaki Testler

### Standart Tetkikler

| Test | Aciklama | Kimler Icin |
|------|----------|-------------|
| Tam Kan Sayimi | Genel saglik taramasi | Tum calisanlar |
| Akciger Grafisi | Solunum sistemi kontrolu | Tozlu/kimyasal ortam |
| Odyometri | Isitme testi | Gurultulu ortam |
| SFT | Solunum fonksiyon testi | Tozlu ortam |
| Gorme Testi | Goz sagligi kontrolu | Tum calisanlar |
| EKG | Kalp ritim kontrolu | 40 yas ustu / agir is |
| Idrar Tahlili | Bobrek ve metabolizma | Kimyasal maruziyet |

### Sektor Bazli Ek Testler

- **Gida sektoru**: Portör muayenesi, hepatit taramasi
- **Saglik sektoru**: Hepatit B, HIV taramasi
- **Kimya sektoru**: Kan kurşun, biyolojik maruziyet
- **Insaat sektoru**: Yuksekte calisma muayenesi
      `.trim(),
      variables: [],
    },
    {
      id: "gecerlilik_sureleri",
      title: "Gecerlilik Sureleri",
      template: `
## Periyodik Muayene Sureleri

Tehlike sinifina gore muayene periyotlari:

| Tehlike Sinifi | Periyot |
|----------------|---------|
| Az Tehlikeli | 5 yilda bir |
| Tehlikeli | 3 yilda bir |
| Cok Tehlikeli | Yilda bir |

### Ozel Durumlar

- **Gece calisanlari**: Yilda bir muayene
- **18 yas alti**: 6 ayda bir muayene
- **Kronik hastalik**: Hekimin belirledigi araliklarla
- **Hamile calisanlar**: Duzgun araliklarla takip

> {{sehir}}'da calisanlariniz icin periyodik muayene takvimi olusturuyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} Saglik Taramasi Sikca Sorulan Sorular

### Ise giris muayenesi zorunlu mu?

**Evet**, 6331 sayili Kanun geregi tum calisanlar ise baslamadan once saglik muayenesinden gecmek zorundadir.

### Periyodik muayene kac yilda bir yapilir?

Tehlike sinifina gore: az tehlikeli 5 yil, tehlikeli 3 yil, cok tehlikeli 1 yil araliklarla yapilir.

### Saglik raporu nereden alinir?

OSGB olarak isyeri hekimimiz tarafindan muayene yapilir ve saglik raporu duzenlenır. Hastane raporu gerekmez.

### {{sehir}}'da saglik taramasi ucreti ne kadar?

Calisan sayisi ve yapilacak tetkiklere gore degisir. **Toplu muayene** indirimi icin bizi arayin.

### Muayene isyerinde yapilabilir mi?

Evet, belirli calisan sayisinin uzerinde isyerinize gelerek muayene yapabiliyoruz. Portatif test ekipmanlarimizla yerinde hizmet veriyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da Saglik Taramasi Icin Randevu Alin

- Ise giris ve periyodik muayene
- Isyerinizde veya merkezimizde hizmet
- {{sehir}} ve {{komsu_iller}} bolgesinde
- Hizli sonuc ve raporlama

📞 **{{telefon}}** | 📧 **{{email}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon", "email"],
    },
  ],
};

// ============================================
// ACIL DURUM PLANI TEMPLATE
// ============================================

export const ACIL_DURUM_PLANI_TEMPLATE: ContentTemplate = {
  serviceId: "acil-durum-plani",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Acil Durum Plani Hazirlama

{{bolge}} bolgesinde **acil durum eylem plani** hazirlama hizmeti.
Isyerinizi olasi acil durumlara karsi hazirlayin.

[Teklif Alin](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da Acil Durum Plani Nedir?

Acil durum plani, isyerinde meydana gelebilecek yangin, deprem, patlama, su baskini gibi acil durumlarda yapilacak islemleri belirleyen zorunlu plandır.

### Plan Kapsamimiz

- **Acil Durum Tipleri**: Yangin, deprem, patlama, kimyasal sizinti, su baskini
- **Tahliye Planlari**: Kat planlari ve tahliye guzergahlari
- **Toplanma Noktasi**: Guvenli toplanma alanlarinin belirlenmesi
- **Gorev Dagilimi**: Acil durum ekipleri ve sorumluluklari
- **Iletisim Plani**: Acil iletisim zincirleri ve numaralari

{{sehir}} ve {{komsu_iller}} bolgesinde isyerinize ozel acil durum plani hazirliyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "ekip_olusturma",
      title: "Acil Durum Ekibi",
      template: `
## Acil Durum Ekipleri

### Zorunlu Ekipler

Her isyerinde asagidaki acil durum ekipleri olusturulmalidir:

1. **Sozdurme Ekibi**: Yangin ve patlama mudahalesi
2. **Kurtarma Ekibi**: Yarali tasiama ve kurtarma
3. **Koruma Ekibi**: Tahliye ve guvenlik
4. **Ilkyardim Ekibi**: Tıbbi ilk mudahale

### Ekip Boyutlari

| Tehlike Sinifi | Sozdurme | Kurtarma | Koruma | Ilkyardim |
|----------------|----------|----------|--------|-----------|
| Az Tehlikeli | %5 | %5 | %5 | %5 |
| Tehlikeli | %8 | %5 | %5 | %8 |
| Cok Tehlikeli | %10 | %8 | %8 | %10 |

*Yuzdelikler toplam calisan sayisina goredir.

> {{sehir}}'da isyeriniz icin acil durum ekiplerini belirliyoruz ve egitimlerini veriyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "tatbikat_bilgi",
      title: "Tatbikat",
      template: `
## Acil Durum Tatbikati

### Tatbikat Turleri

- **Masa Basi Tatbikati**: Senaryo uzerinden tartisma
- **Fonksiyonel Tatbikat**: Belirli ekiplerin uygulamali calismasi
- **Tam Olcekli Tatbikat**: Tum bina ve calisanların katilimiyla

### Tatbikat Adimlari

1. Senaryo belirleme
2. Katilimcilari bilgilendirme
3. Tatbikat baslama (alarm)
4. Tahliye ve mudahale
5. Personel sayimi
6. Degerlendirme toplantisi
7. Rapor hazirlama

Yilda en az **1 kez** acil durum tatbikati yapilmalidir.
      `.trim(),
      variables: [],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} Acil Durum Plani Sikca Sorulan Sorular

### Acil durum plani zorunlu mu?

**Evet**, 6331 sayili Kanun ve Isyerlerinde Acil Durumlar Hakkinda Yonetmelik geregi tum isyerleri acil durum plani hazirlmak zorundadir.

### Acil durum plani kac yilda bir guncellenir?

Risk degerlendirmesi yenilendiginde, isyeri yapisinda degisiklik oldugunda veya tatbikat sonrasi eksiklik tespit edildiginde guncellenmelidir.

### {{sehir}}'da acil durum plani ucreti ne kadar?

Isyeri buyuklugu, kat sayisi ve calisan sayisina gore degisir. **Ucretsiz keşif** ile fiyat teklifi sunuyoruz.

### Acil durum plani icin neler gerekli?

Isyeri kat planlari, calisan listesi, tehlike kaynaklari listesi ve mevcut guvenlik ekipmanlari bilgisi gereklidir.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da Acil Durum Plani Hazirlatalim

- Isyerine ozel acil durum plani
- Tahliye plani ve kat krokileri
- Ekip olusturma ve egitim
- {{sehir}} ve {{komsu_iller}} bolgesinde hizmet

📞 **{{telefon}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon"],
    },
  ],
};

// ============================================
// ISG KURULU TEMPLATE
// ============================================

export const ISG_KURULU_TEMPLATE: ContentTemplate = {
  serviceId: "isg-kurulu",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} ISG Kurul Toplantilari

{{bolge}} bolgesinde **is sagligi ve guvenligi kurul toplantisi** organizasyonu.
Yasal zorunlulugunuzu profesyonelce karsilayin.

[Bilgi Alin](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da ISG Kurulu Nedir?

Is Sagligi ve Guvenligi Kurulu, isyerinde ISG konularinda karar almak, onlem onerileri gelistirmek ve uygulamalari izlemek icin kurulan zorunlu organdır.

### ISG Kurulu Ne Zaman Zorunlu?

- **50 ve uzeri** calisan bulunan tum isyerlerinde ISG kurulu olusturmak **zorunludur**
- Ayni calisma alaninda birden fazla isveren varsa **ortak kurul** olusturulabilir
- Asıl isveren - alt isveren iliskisinde koordinasyon saglanmalidir

{{sehir}} ve {{komsu_iller}} bolgesinde ISG kurul toplantisi organizasyonu ve danismanlik hizmeti veriyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "kurul_uyeleri",
      title: "Kurul Uyeleri",
      template: `
## ISG Kurulu Kimlerden Olusur?

### Zorunlu Uyeler

| Uye | Gorev |
|-----|-------|
| **Isveren veya vekili** | Kurul baskani |
| **Is guvenligi uzmani** | Kurul sekreteri |
| **Isyeri hekimi** | Saglik danismani |
| **Insan kaynaklari sorumlusu** | Personel koordinasyonu |
| **Calisan temsilcisi** | Calisanlarin sesi |
| **Sivil savunma uzmani** | Acil durum (varsa) |

### Calisan Temsilcisi Secimi

- 50-100 calisan: **1** temsilci
- 101-500 calisan: **2** temsilci
- 501-1000 calisan: **3** temsilci
- 1001-2000 calisan: **4** temsilci
- 2001+ calisan: **5** temsilci

Temsilciler calisanlar arasından **secimle** belirlenir.
      `.trim(),
      variables: [],
    },
    {
      id: "toplanti_esaslari",
      title: "Toplanti Esaslari",
      template: `
## ISG Kurul Toplantisi Esaslari

### Toplanti Periyodu

| Tehlike Sinifi | Toplanti Sikligi |
|----------------|-----------------|
| Az Tehlikeli | 3 ayda bir |
| Tehlikeli | 2 ayda bir |
| Cok Tehlikeli | Ayda bir |

### Toplanti Gundemi

1. Bir onceki toplanti kararlarinin degerlendirmesi
2. Is kazasi ve ramak kala olaylarin incelenmesi
3. Risk degerlendirmesi sonuclarinin gorusulmesi
4. Calisan onerileri ve sikayetleri
5. Yeni onlem ve uygulamalar
6. Egitim planlari

### Toplanti Tutanagi

Her toplanti kayit altina alinmali ve tutanak tum uyelerce imzalanmalidir. Kararlar isverene yazili olarak bildirilir.

> {{sehir}}'da ISG kurul toplantılarınızı organize ediyoruz ve sekretarya hizmeti sunuyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} ISG Kurulu Sikca Sorulan Sorular

### ISG kurulu kac calisanda zorunlu?

**50 ve uzerinde** calisan bulunan isyerlerinde ISG kurulu zorunludur.

### ISG kurul toplantisi kac ayda bir yapilir?

Tehlike sinifina gore: az tehlikeli 3 ay, tehlikeli 2 ay, cok tehlikeli her ay yapilmalidir.

### ISG kurulu kararlari baglayici mi?

Kurul kararlari **tavsiye** niteligi tasir, ancak isveren kararlara uymama gerekcessini yazili olarak aciklamak zorundadir.

### {{sehir}}'da ISG kurul danismanligi ucreti ne kadar?

Calisan sayisi ve toplanti sikligina gore degisir. Kurul organizasyonu, sekretarya ve dokumantasyon dahil **paket fiyat** sunuyoruz.

### ISG kurulu olusturmaminin cezasi nedir?

{{yil}} yilinda ISG kurulu olusturmayan isverenler **idari para cezasi** ile karsi karsiya kalir.
      `.trim(),
      variables: ["sehir", "yil"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da ISG Kurul Hizmeti

- Kurul olusturma danismanligi
- Toplanti organizasyonu ve sekretarya
- Tutanak ve karar takibi
- {{sehir}} ve {{komsu_iller}} bolgesinde

📞 **{{telefon}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon"],
    },
  ],
};

// ============================================
// ONAYLI DEFTER TEMPLATE
// ============================================

export const ONAYLI_DEFTER_TEMPLATE: ContentTemplate = {
  serviceId: "onayli-defter",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} Onayli Defter Islemleri

{{bolge}} bolgesinde **onayli defter** tutma ve onaylama hizmeti.
ISG defter yukumlulugunuzu eksiksiz yerine getirin.

[Bilgi Alin](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da Onayli Defter Nedir?

Onayli defter, isyeri hekimi ve is guvenligi uzmaninin calisma kayitlarini, tavsiyelerini ve tespitlerini yazili olarak kayit altina aldigi resmi defterdir.

### Onayli Defterin Onemi

- **Yasal Zorunluluk**: ISG hizmetlerinin belgelenmesi zorunludur
- **Kanit Niteliginde**: Is kazasi ve denetim durumlarinda resmi belge
- **Takip Araci**: Yapilan is ve onerilerin takibi
- **Sorumluluk Belgesi**: ISG profesyonellerinin yasal korumasi

{{sehir}} ve {{komsu_iller}} bolgesinde onayli defter temini ve islemleri hizmeti sunuyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "defter_turleri",
      title: "Defter Turleri",
      template: `
## Onayli Defter Turleri

### Isyeri Sagligi ve Guvenligi Birimi Defteri

Ana defter olup asagidaki kayitlari icerir:

- Isyeri hekimi gorusme ve tavsiyeleri
- Is guvenligi uzmani tespit ve onerileri
- Risk degerlendirmesi sonuclari
- Is kazasi ve ramak kala olaylar
- Egitim kayitlari

### Kayit Gereksinimleri

Her kayit icin:

1. **Tarih ve saat**
2. **Kaydı yapan** (isyeri hekimi / is guvenligi uzmani)
3. **Tespit / oneri** icerigi
4. **Isveren bilgilendirme** imzasi
5. **Aksiyon durumu** (yapildi / bekliyor)
      `.trim(),
      variables: [],
    },
    {
      id: "onaylama_sureci",
      title: "Onaylama Sureci",
      template: `
## Onayli Defter Onaylama Sureci

### Nereden Temin Edilir?

Onayli defter **Calisma ve Sosyal Guvenlik Il Mudurlugu** veya **noter** tarafindan onayli olarak temin edilir.

### Onaylama Adimlari

1. Defter temini (il mudurlugu veya noter)
2. Defterin **numaralanmasi ve muhurlenmmesi**
3. Ilk sayfaya isyeri bilgilerinin yazilmasi
4. ISG profesyonellerinin deftere kayit baslattmasi
5. Her kaydin isveren tarafindan gorulup imzalanmasi

### Dikkat Edilecekler

- Defterde **silinti ve kazinti** olmamali
- Sayfalar kopartilmamali
- Kayitlar **kronolojik** sirayla yapilmali
- Dolu defter **30 yil** saklanmali

> {{sehir}}'da onayli defter temini ve islemleri icin bizi arayin.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} Onayli Defter Sikca Sorulan Sorular

### Onayli defter zorunlu mu?

**Evet**, ISG hizmetleri yonetmeligi geregi her isyerinde onayli defter bulundurmak zorunludur.

### Onayli defter nereden onaylatilir?

Calisma ve Sosyal Guvenlik Il Mudurlugu veya **noter** tarafindan onaylatilabilir.

### Onayli deftere kim yazar?

Isyeri hekimi ve is guvenligi uzmani onayli deftere kayit yapar. Isveren kayitlari gorur ve imzalar.

### {{sehir}}'da onayli defter ucreti ne kadar?

Defter temini ve onaylama islemleri dahil hizmet veriyoruz. Fiyat bilgisi icin bizi arayin.

### Onayli defter dolunca ne yapilir?

Dolu defter saklanir ve yeni defter onaylatilarak kullanima alinir. Eski defterler **30 yil** muhafaza edilmelidir.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da Onayli Defter Hizmeti

- Defter temini ve onaylama
- Kayit tutma rehberligi
- {{sehir}} ve {{komsu_iller}} bolgesinde
- ISG hizmetleriyle entegre cozum

📞 **{{telefon}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon"],
    },
  ],
};

// ============================================
// ISG-KATIP TEMPLATE
// ============================================

export const ISG_KATIP_TEMPLATE: ContentTemplate = {
  serviceId: "isg-katip",
  sections: [
    {
      id: "hero",
      title: "Hero",
      template: `
# {{bolge}} ISG-KATIP Islemleri

{{bolge}} bolgesinde **ISG-KATIP** sistemi uzerinden tum bildirim ve takip islemleri.
Bakanlık bildirimlerinizi eksiksiz ve zamaninda yapiyoruz.

[Hizmet Alin](#iletisim) | [Hemen Arayin](tel:{{telefon}})
      `.trim(),
      variables: ["bolge", "telefon"],
    },
    {
      id: "hizmet_tanimi",
      title: "Hizmet Tanimi",
      template: `
## {{bolge}}'da ISG-KATIP Nedir?

ISG-KATIP, Calisma ve Sosyal Guvenlik Bakanligi tarafindan isletilen elektronik kayit ve bildirim sistemidir. Tum ISG hizmetlerinin bu sistem uzerinden kayit altina alinmasi zorunludur.

### ISG-KATIP Uzerinden Yapilan Islemler

- **OSGB Sozlesmesi**: Isyeri ile OSGB arasındaki hizmet sozlesmesi
- **Atama Bildirimi**: Isyeri hekimi ve uzman atamalari
- **Egitim Kaydi**: Verilen egitimlerin kayit altina alinmasi
- **Risk Analizi Bildirimi**: Hazirlanan risk analizlerinin yuklenmesi
- **Calisma Suresi**: ISG profesyonellerinin calisma suresi takibi

{{sehir}} ve {{komsu_iller}} bolgesinde tüm ISG-KATIP islemlerinizi yapiyoruz.
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller"],
    },
    {
      id: "bildirim_turleri",
      title: "Bildirim Turleri",
      template: `
## ISG-KATIP Bildirim Turleri

### Zorunlu Bildirimler

| Bildirim | Sure | Yapan |
|----------|------|-------|
| OSGB Sozlesmesi | Hizmet baslangicinda | OSGB |
| Hekim/Uzman Atamasi | Atama yapildiginda | OSGB |
| Egitim Kaydi | Egitim sonrasi 15 gun | Egitim veren |
| Risk Analizi | Tamamlandiginda | Is guvenligi uzmani |
| Is Kazasi | 3 is gunu icinde | Isveren |
| Meslek Hastaligi | Tespit edildiginde | Isyeri hekimi |

### Bildirim Yapilmamasinin Sonuclari

- **Idari para cezasi** uygulanir
- ISG hizmetleri **gecersiz** sayilabilir
- Denetimlerde **uygunsuzluk** raporu
- Is kazasi durumunda **agirlaştırıcı** etken
      `.trim(),
      variables: [],
    },
    {
      id: "surec_adimlari",
      title: "Hizmet Surecimiz",
      template: `
## ISG-KATIP Hizmet Surecimiz

### 1. Baslangıc

- Isyeri bilgilerinin sisteme girilmesi
- OSGB sozlesmesinin kaydi
- ISG profesyonellerinin atanmasi

### 2. Duzgun Bildirimler

- Aylık calisma suresi bildirimleri
- Egitim kayitlarinin girilmesi
- Risk analizi ve dokumanlarin yuklenmesi

### 3. Takip ve Kontrol

- Bildirim surelerinin takibi
- Eksik bildirimlerin tamamlanmasi
- Bakanlik uyarilarinin izlenmesi

### 4. Raporlama

- Aylik durum raporu
- Yillik ozet rapor
- Denetim oncesi kontrol listesi

> {{sehir}}'da ISG-KATIP islemlerinizi profesyonelce yonetiyoruz.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "sss",
      title: "SSS",
      template: `
## {{sehir}} ISG-KATIP Sikca Sorulan Sorular

### ISG-KATIP kullanimi zorunlu mu?

**Evet**, tum ISG hizmetlerinin ISG-KATIP uzerinden kayit altina alinmasi yasal zorunluluktur.

### ISG-KATIP sifresi nasil alinir?

Isveren veya yetkilisi e-Devlet uzerinden ISG-KATIP sistemine giris yapabilir. OSGB olarak islemlerinizi sizin adınıza yonetiyoruz.

### ISG-KATIP bildirimi yapilmazsa ne olur?

Bildirim yapilmamasi durumunda idari para cezasi uygulanir. Ayrica ISG hizmetleri gecersiz sayilabilir.

### {{sehir}}'da ISG-KATIP hizmeti ucreti ne kadar?

ISG-KATIP islemleri genel ISG hizmet paketimize dahildir. Ayri ucret talep etmiyoruz.

### ISG-KATIP'e hangi bildirimler yapilmali?

OSGB sozlesmesi, hekim/uzman atamasi, egitim kaydi, risk analizi, is kazasi ve meslek hastaligi bildirimleri yapilmalidir.
      `.trim(),
      variables: ["sehir"],
    },
    {
      id: "cta",
      title: "CTA",
      template: `
## {{bolge}}'da ISG-KATIP Islemleri

- Tum bildirimlerin zamaninda yapilmasi
- Surec takibi ve raporlama
- {{sehir}} ve {{komsu_iller}} bolgesinde
- ISG hizmet paketine dahil

📞 **{{telefon}}**
      `.trim(),
      variables: ["bolge", "sehir", "komsu_iller", "telefon"],
    },
  ],
};

// ============================================
// TEMPLATE REGISTRY
// ============================================

export const CONTENT_TEMPLATES: Record<string, ContentTemplate> = {
  "isyeri-hekimi": ISYERI_HEKIMI_TEMPLATE,
  "is-guvenligi-uzmani": IS_GUVENLIGI_UZMANI_TEMPLATE,
  "risk-analizi": RISK_ANALIZI_TEMPLATE,
  "isg-egitimi": ISG_EGITIMI_TEMPLATE,
  "ilkyardim-egitimi": ILKYARDIM_EGITIMI_TEMPLATE,
  "yangin-egitimi": YANGIN_EGITIMI_TEMPLATE,
  "saglik-taramasi": SAGLIK_TARAMASI_TEMPLATE,
  "acil-durum-plani": ACIL_DURUM_PLANI_TEMPLATE,
  "isg-kurulu": ISG_KURULU_TEMPLATE,
  "onayli-defter": ONAYLI_DEFTER_TEMPLATE,
  "isg-katip": ISG_KATIP_TEMPLATE,
};

/**
 * Service ID'ye gore template getir
 */
export function getTemplateForService(serviceId: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES[serviceId];
}

/**
 * Sayfa icerigini render et
 */
export function renderPageContent(
  serviceId: string,
  province: Province,
  district?: District,
  options?: {
    companyName?: string;
    phone?: string;
    email?: string;
  }
): RenderedContent | null {
  const service = getServiceById(serviceId);
  const template = getTemplateForService(serviceId);

  if (!service || !template) {
    return null;
  }

  const variables = prepareVariables(province, service, district, options);

  let html = "";
  const headings: { level: number; text: string }[] = [];

  for (const section of template.sections) {
    const rendered = renderTemplate(section.template, variables);
    html += rendered + "\n\n";

    // Heading'leri cikart
    let headingMatch: RegExpExecArray | null;
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    while ((headingMatch = headingRegex.exec(rendered)) !== null) {
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
    }
  }

  // Plain text versiyonu (markdown olmadan)
  const plainText = html
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[|:-]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  return {
    html,
    plainText,
    wordCount,
    headings,
  };
}
