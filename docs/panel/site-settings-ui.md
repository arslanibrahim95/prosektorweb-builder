# Panel UI Ayarlari Dokumani

Bu dokuman, panelde `site.settings` uzerinden UI, tema ve yerlesim ayarlarinin nasil yonetilecegini anlatir.

## Kapsam

Canli renderer tarafinda desteklenen alanlar:

- `navigation_links` / `navigationLinks`
- `footer_links` / `footerLinks`
- `header_cta_label` / `headerCtaLabel`
- `header_cta_href` / `headerCtaHref`
- `theme_tokens` / `themeTokens`
- `layout_config` / `layoutConfig`
- `section_variants` / `sectionVariants`

## 1) Header ve Footer Linkleri

Panelde linkler dizi olarak kaydedilir:

```json
[
  { "label": "Ana Sayfa", "href": "/" },
  { "label": "Hizmetler", "href": "/hizmetler" },
  { "label": "Blog", "href": "/blog" },
  { "label": "Iletisim", "href": "/iletisim" }
]
```

Kurallar:

- `href: "/"` ana sayfayi temsil eder.
- `https://`, `mailto:`, `tel:` dis baglanti olarak korunur.
- Ayni `href` birden fazla kez girilirse ilk kayit kullanilir.

## 2) Header CTA

```json
{
  "header_cta_label": "Teklif Al",
  "header_cta_href": "/iletisim"
}
```

Notlar:

- `header_cta_href` verilmezse varsayilan `"/iletisim"` kullanilir.
- Dis link verilebilir.

## 3) Theme Tokens

```json
{
  "theme_tokens": {
    "primaryColor": "#0f6ad7",
    "secondaryColor": "#0b4ca4",
    "accentColor": "#f59e0b",
    "backgroundColor": "#f6f8fb",
    "fontHeading": "Sora",
    "fontBody": "Manrope"
  }
}
```

Kurallar:

- Renk alanlari HEX formatinda olmalidir (`#RRGGBB` veya `#RGB`).
- Font alanlari bos birakilamaz.
- Bu alanlar canli tarafta `brand_color`, `secondary_color`, `accent_color`, `background_color`, `font_heading`, `font_body` ile de senkron tutulur.

## 4) Layout Config (Sayfa Yerlesimi)

```json
{
  "layout_config": {
    "pages": {
      "/": {
        "sectionOrder": ["hero", "services", "about", "cta", "contact", "faq", "team", "stats", "gallery", "testimonials", "content"],
        "hiddenSections": ["faq"]
      },
      "/hizmetler": {
        "sectionOrder": ["hero", "services", "cta", "content"],
        "hiddenSections": []
      }
    }
  }
}
```

Desteklenen sayfalar:

- `/`
- `/hakkimizda`
- `/hizmetler`
- `/iletisim`
- `/blog`

Desteklenen bolum tipleri:

- `hero`, `services`, `about`, `cta`, `contact`, `faq`, `team`, `stats`, `gallery`, `testimonials`, `content`

## 5) Section Variants

```json
{
  "section_variants": {
    "hero": "spotlight",
    "services": "list",
    "about": "card",
    "cta": "minimal",
    "contact": "compact"
  }
}
```

Izinli varyantlar:

- `hero`: `default`, `spotlight`, `compact`
- `services`: `cards`, `list`, `compact`
- `about`: `default`, `card`
- `cta`: `banner`, `minimal`
- `contact`: `default`, `compact`

## 6) Iletisim Sayfasi Contact Block

`contact` block panelde aktifse iletisim sayfasinda fallback `ContactSection` ikinci kez render edilmez.

Ornek:

```json
{
  "blockType": "contact",
  "title": "Bizimle Iletisime Gecin",
  "subtitle": "Talebinizi birakin, ekibimiz geri donsun",
  "showMap": true
}
```

## 7) Panel Docs ve Yayin Akisi

- Panel icinde rehber sayfasi: `/projects/docs`

Yayin akisi:

1. Proje detayindan UI ayarlarini guncelleyin.
2. `UI Ayarlarini Kaydet` ile `site.settings` yazin.
3. `Yayinla` ile canliya alin.
4. Header/footer, tema tokenlari, section order ve section varyantlarini kontrol edin.
