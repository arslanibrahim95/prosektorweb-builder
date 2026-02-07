import { PrismaClient, type BlogPostStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample company
  const company = await prisma.company.upsert({
    where: { id: 'sample-company-1' },
    update: {},
    create: {
      id: 'sample-company-1',
      name: 'ABC OSGB',
      email: 'info@abcosgb.com',
      phone: '+90 212 555 1234',
      address: 'Atatürk Caddesi No:123, Şişli, İstanbul',
      taxId: '1234567890',
    },
  });
  console.log('Created company:', company.name);

  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: 'admin@abcosgb.com' },
    update: {},
    create: {
      email: 'admin@abcosgb.com',
      name: 'Admin User',
      role: 'ADMIN',
      companyId: company.id,
    },
  });
  console.log('Created user:', user.email);

  // Create sample web project
  const project = await prisma.webProject.upsert({
    where: { slug: 'abc-osgb' },
    update: {},
    create: {
      name: 'ABC OSGB Web Sitesi',
      slug: 'abc-osgb',
      description: 'ABC OSGB şirketi için profesyonel web sitesi',
      template: 'osgb-standard',
      industry: 'OSGB',
      status: 'LIVE',
      priority: 'HIGH',
      companyId: company.id,
      userId: user.id,
      progress: 100,
    },
  });
  console.log('Created project:', project.name);

  // Create site settings
  const siteSettings = await prisma.siteSettings.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      phone: '+90 212 555 1234',
      email: 'info@abcosgb.com',
      address: 'Atatürk Caddesi No:123, Şişli, İstanbul',
      workingHours: 'Pazartesi - Cuma: 09:00 - 18:00',
      mapEmbed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.1234!2d28.9876!3d41.0123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDAwJzQ0LjMiTiAyOMKwNTknMTUuNCJF!5e0!3m2!1str!2str!4v1234567890" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
      socialMedia: {
        facebook: 'https://facebook.com/abcosgb',
        twitter: 'https://twitter.com/abcosgb',
        instagram: 'https://instagram.com/abcosgb',
        linkedin: 'https://linkedin.com/company/abcosgb',
      },
      siteTitle: 'ABC OSGB - İş Sağlığı ve Güvenliği Hizmetleri',
      siteDescription: 'ABC OSGB olarak işletmenize profesyonel iş sağlığı ve güvenliği hizmetleri sunuyoruz. İşyeri hekimliği, iş güvenliği uzmanlığı ve eğitim hizmetleri.',
      keywords: ['osgb', 'iş sağlığı', 'iş güvenliği', 'işyeri hekimi', 'istanbul osgb'],
      design: {
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        logoUrl: null,
        faviconUrl: null,
      },
    },
  });
  console.log('Created site settings for:', project.name);

  // Create generated content
  const contentTypes = [
    {
      contentType: 'HOMEPAGE',
      title: 'Ana Sayfa',
      content: JSON.stringify({
        hero: {
          title: 'Profesyonel İş Sağlığı ve Güvenliği Hizmetleri',
          subtitle: 'İşletmenizin güvenliği bizim önceliğimiz',
          cta: 'Hemen Başvurun',
        },
        services: [
          { title: 'İşyeri Hekimliği', description: 'Deneyimli işyeri hekimlerimizle çalışanlarınızın sağlığını koruyoruz.' },
          { title: 'İş Güvenliği Uzmanlığı', description: 'Uzman kadromuzla iş kazalarını önlüyor, güvenli çalışma ortamı sağlıyoruz.' },
          { title: 'Risk Değerlendirmesi', description: 'İşyerinize özel risk analizleri yapıyor, önlemler belirliyoruz.' },
          { title: 'Eğitim Hizmetleri', description: 'Çalışanlarınıza yasal zorunlu İSG eğitimleri veriyoruz.' },
        ],
        stats: [
          { value: '500+', label: 'Mutlu Müşteri' },
          { value: '15+', label: 'Yıllık Tecrübe' },
          { value: '10000+', label: 'Eğitim Verilen Çalışan' },
        ],
      }),
      metaTitle: 'ABC OSGB - İş Sağlığı ve Güvenliği Hizmetleri | İstanbul',
      metaDescription: 'ABC OSGB ile işletmenize profesyonel iş sağlığı ve güvenliği hizmetleri. İşyeri hekimliği, iş güvenliği uzmanlığı, risk değerlendirmesi ve eğitim hizmetleri.',
    },
    {
      contentType: 'ABOUT',
      title: 'Hakkımızda',
      content: JSON.stringify({
        title: 'Hakkımızda',
        description: 'ABC OSGB olarak 2009 yılından bu yana iş sağlığı ve güvenliği alanında hizmet vermekteyiz. Deneyimli kadromuz ve modern yaklaşımımızla işletmelere güvenli çalışma ortamı sağlıyoruz.',
        mission: 'İşletmelerin yasal yükümlülüklerini yerine getirmelerine yardımcı olurken, çalışanların sağlığını ve güvenliğini en üst düzeyde korumak.',
        vision: 'Türkiye\'nin en güvenilir ve tercih edilen OSGB\'si olmak.',
        values: ['Güvenilirlik', 'Profesyonellik', 'Müşteri Memnuniyeti', 'Sürekli Gelişim'],
        team: [
          { name: 'Dr. Ahmet Yılmaz', role: 'İşyeri Hekimi', image: null },
          { name: 'Mehmet Demir', role: 'A Sınıfı İSG Uzmanı', image: null },
          { name: 'Ayşe Kaya', role: 'İSG Eğitmeni', image: null },
        ],
      }),
      metaTitle: 'Hakkımızda | ABC OSGB',
      metaDescription: 'ABC OSGB hakkında bilgi edinin. 2009\'dan bu yana iş sağlığı ve güvenliği alanında profesyonel hizmet veriyoruz.',
    },
    {
      contentType: 'SERVICES',
      title: 'Hizmetlerimiz',
      content: JSON.stringify({
        title: 'Hizmetlerimiz',
        intro: 'İşletmenizin ihtiyaçlarına uygun kapsamlı iş sağlığı ve güvenliği çözümleri sunuyoruz.',
        services: [
          {
            title: 'İşyeri Hekimliği Hizmeti',
            description: 'Deneyimli işyeri hekimlerimiz, çalışanlarınızın periyodik muayenelerini yapar, işe giriş muayeneleri düzenler ve sağlık gözetimi yapar.',
            features: ['Periyodik muayeneler', 'İşe giriş muayeneleri', 'Poliklinik hizmeti', 'Sağlık raporları'],
          },
          {
            title: 'İş Güvenliği Uzmanlığı',
            description: 'A, B ve C sınıfı iş güvenliği uzmanlarımız işyerinizde risk değerlendirmesi yapar ve güvenlik önlemlerini belirler.',
            features: ['Risk değerlendirmesi', 'Acil durum planları', 'İSG kurulu toplantıları', 'Denetim ve kontrol'],
          },
          {
            title: 'İSG Eğitimleri',
            description: '6331 sayılı kanun kapsamında zorunlu iş sağlığı ve güvenliği eğitimlerini uzman eğitmenlerimizle veriyoruz.',
            features: ['Temel İSG eğitimi', 'Yangın eğitimi', 'İlk yardım eğitimi', 'Tehlikeli madde eğitimi'],
          },
          {
            title: 'Risk Değerlendirmesi',
            description: 'İşyerinize özel detaylı risk analizi yapıyor ve önlemleri belirliyoruz.',
            features: ['5x5 matris yöntemi', 'Fine-Kinney analizi', 'Önlem planları', 'Takip ve güncelleme'],
          },
        ],
      }),
      metaTitle: 'Hizmetlerimiz | ABC OSGB',
      metaDescription: 'ABC OSGB hizmetleri: İşyeri hekimliği, iş güvenliği uzmanlığı, İSG eğitimleri, risk değerlendirmesi ve daha fazlası.',
    },
    {
      contentType: 'CONTACT',
      title: 'İletişim',
      content: JSON.stringify({
        title: 'İletişim',
        subtitle: 'Bizimle iletişime geçin, size en kısa sürede dönüş yapalım.',
        formFields: ['name', 'email', 'phone', 'company', 'message'],
      }),
      metaTitle: 'İletişim | ABC OSGB',
      metaDescription: 'ABC OSGB ile iletişime geçin. Adres, telefon ve e-posta bilgilerimiz.',
    },
  ];

  for (const content of contentTypes) {
    await prisma.generatedContent.upsert({
      where: {
        projectId_contentType: {
          projectId: project.id,
          contentType: content.contentType,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        ...content,
        status: 'APPROVED',
      },
    });
  }
  console.log('Created generated content for:', project.name);

  // Create sample blog posts
  const blogPosts: Array<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: BlogPostStatus;
    publishedAt?: Date;
  }> = [
    {
      title: 'İş Güvenliği Neden Önemlidir?',
      slug: 'is-guvenligi-neden-onemlidir',
      excerpt: 'İş güvenliği, çalışanların sağlığını korumak ve iş kazalarını önlemek için kritik öneme sahiptir.',
      content: `# İş Güvenliği Neden Önemlidir?

İş güvenliği, modern işletmelerin vazgeçilmez bir parçasıdır. Çalışanların sağlığını korumak, iş kazalarını önlemek ve yasal yükümlülükleri yerine getirmek için iş güvenliği uygulamaları büyük önem taşır.

## İş Güvenliğinin Faydaları

1. **Çalışan Sağlığının Korunması**: İş kazaları ve meslek hastalıklarının önlenmesi
2. **Verimlilik Artışı**: Güvenli ortamda çalışanlar daha verimli olur
3. **Maliyet Tasarrufu**: Kaza maliyetlerinden kaçınma
4. **Yasal Uyumluluk**: 6331 sayılı kanun gerekliliklerinin karşılanması

## Sonuç

İş güvenliği yatırımları, hem çalışanlar hem de işletmeler için uzun vadede büyük faydalar sağlar.`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: '6331 Sayılı İş Sağlığı ve Güvenliği Kanunu Hakkında',
      slug: '6331-sayili-is-sagligi-guvenligi-kanunu',
      excerpt: '6331 sayılı kanun, Türkiye\'de iş sağlığı ve güvenliği alanında temel düzenlemeleri içerir.',
      content: `# 6331 Sayılı İş Sağlığı ve Güvenliği Kanunu

6331 sayılı İş Sağlığı ve Güvenliği Kanunu, 30 Haziran 2012 tarihinde yürürlüğe girmiştir. Bu kanun, işyerlerinde iş sağlığı ve güvenliğinin sağlanması için işveren ve çalışanların görev, yetki ve sorumluluklarını düzenler.

## Kanunun Temel Maddeleri

### İşverenin Yükümlülükleri
- Risk değerlendirmesi yaptırmak
- İş güvenliği uzmanı ve işyeri hekimi görevlendirmek
- Çalışanlara eğitim vermek
- Acil durum planları hazırlamak

### Çalışanların Yükümlülükleri
- Eğitimlere katılmak
- Kişisel koruyucu donanımları kullanmak
- Tehlikeli durumları bildirmek

## Sonuç

6331 sayılı kanun, iş sağlığı ve güvenliği kültürünün oluşturulmasında önemli bir adımdır.`,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
      title: 'Risk Değerlendirmesi Nasıl Yapılır?',
      slug: 'risk-degerlendirmesi-nasil-yapilir',
      excerpt: 'Risk değerlendirmesi, işyerindeki tehlikeleri belirlemek ve önlemler almak için yapılan sistematik bir süreçtir.',
      content: `# Risk Değerlendirmesi Nasıl Yapılır?

Risk değerlendirmesi, işyerindeki tehlikeleri ve riskleri belirlemek, analiz etmek ve kontrol önlemleri almak için yapılan sistematik bir süreçtir.

## Risk Değerlendirmesi Adımları

1. **Tehlikelerin Belirlenmesi**: İşyerindeki potansiyel tehlikelerin tespit edilmesi
2. **Risklerin Değerlendirilmesi**: Tehlikelerin olasılık ve şiddetinin belirlenmesi
3. **Kontrol Önlemlerinin Belirlenmesi**: Riskleri azaltacak önlemlerin planlanması
4. **Uygulama**: Belirlenen önlemlerin hayata geçirilmesi
5. **İzleme ve Gözden Geçirme**: Önlemlerin etkinliğinin takibi

## Risk Değerlendirme Yöntemleri

- 5x5 Matris Yöntemi
- Fine-Kinney Yöntemi
- FMEA (Hata Türü ve Etkileri Analizi)

Risk değerlendirmesi en az 2 yılda bir veya önemli değişikliklerde güncellenmelidir.`,
      status: 'DRAFT',
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: {
        projectId_slug: {
          projectId: project.id,
          slug: post.slug,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        ...post,
      },
    });
  }
  console.log('Created blog posts for:', project.name);

  // Create second company for multi-tenant testing
  const company2 = await prisma.company.upsert({
    where: { id: 'sample-company-2' },
    update: {},
    create: {
      id: 'sample-company-2',
      name: 'XYZ İş Güvenliği',
      email: 'info@xyzisguvenligi.com',
      phone: '+90 216 444 5678',
      address: 'Bağdat Caddesi No:456, Kadıköy, İstanbul',
      taxId: '9876543210',
    },
  });
  console.log('Created company:', company2.name);

  const user2 = await prisma.user.upsert({
    where: { email: 'admin@xyzisguvenligi.com' },
    update: {},
    create: {
      email: 'admin@xyzisguvenligi.com',
      name: 'XYZ Admin',
      role: 'USER',
      companyId: company2.id,
    },
  });
  console.log('Created user:', user2.email);

  const project2 = await prisma.webProject.upsert({
    where: { slug: 'xyz-is-guvenligi' },
    update: {},
    create: {
      name: 'XYZ İş Güvenliği Web Sitesi',
      slug: 'xyz-is-guvenligi',
      description: 'XYZ İş Güvenliği şirketi için web sitesi',
      template: 'osgb-modern',
      industry: 'OSGB',
      status: 'DESIGNING',
      priority: 'MEDIUM',
      companyId: company2.id,
      userId: user2.id,
      progress: 40,
    },
  });
  console.log('Created project:', project2.name);

  await prisma.siteSettings.upsert({
    where: { projectId: project2.id },
    update: {},
    create: {
      projectId: project2.id,
      phone: '+90 216 444 5678',
      email: 'info@xyzisguvenligi.com',
      address: 'Bağdat Caddesi No:456, Kadıköy, İstanbul',
      workingHours: 'Pazartesi - Cumartesi: 08:30 - 19:00',
      socialMedia: {
        facebook: 'https://facebook.com/xyzisguvenligi',
        linkedin: 'https://linkedin.com/company/xyzisguvenligi',
      },
      siteTitle: 'XYZ İş Güvenliği - OSGB Hizmetleri',
      siteDescription: 'XYZ İş Güvenliği ile işletmenize profesyonel OSGB hizmetleri.',
      keywords: ['osgb', 'iş güvenliği', 'kadıköy osgb'],
      design: {
        primaryColor: '#059669',
        secondaryColor: '#10b981',
        fontHeading: 'Poppins',
        fontBody: 'Open Sans',
        logoUrl: null,
        faviconUrl: null,
      },
    },
  });
  console.log('Created site settings for:', project2.name);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
