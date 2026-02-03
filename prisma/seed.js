const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding...')

    // Create a Company
    const company = await prisma.company.create({
        data: {
            name: 'Örnek OSGB Hizmetleri',
            email: 'info@ornekosgb.com',
            phone: '0212 123 45 67',
        }
    })

    // Create an Admin User
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@prosektorweb.com',
            role: 'ADMIN',
        }
    })

    // Create a Customer User
    const customer = await prisma.user.create({
        data: {
            name: 'Müşteri Kullanıcısı',
            email: 'osgb_sahibi@gmail.com',
            role: 'USER',
            companyId: company.id,
        }
    })

    // Create a Web Project
    const project = await prisma.webProject.create({
        data: {
            name: 'Örnek OSGB Web Sitesi',
            slug: 'ornek-osgb-site',
            companyId: company.id,
            userId: customer.id,
            status: 'DEVELOPMENT',
            industry: 'OSGB',
            template: 'standard',
        }
    })

    // Create some sections
    await prisma.page.create({
        data: {
            projectId: project.id,
            name: 'Ana Sayfa',
            slug: 'index',
            sections: {
                create: [
                    { type: 'hero', title: 'Güvenli Gelecek İçin Çözüm Ortağınız', content: 'OSGB hizmetlerinde öncü kuruluş.' },
                    { type: 'services', title: 'Hizmetlerimiz', content: 'İş sağlığı ve güvenliği taramaları, eğitimler.' }
                ]
            }
        }
    })

    // Create Generated Content (This is what the customer edits in the portal)
    await prisma.generatedContent.create({
        data: {
            projectId: project.id,
            contentType: 'HOMEPAGE',
            title: 'Ana Sayfa İçeriği',
            content: '<h1>Hoş Geldiniz</h1><p>Bu içerik müşteri panelinden düzenlenebilir.</p>',
            status: 'APPROVED'
        }
    })

    console.log('Seeding finished successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
