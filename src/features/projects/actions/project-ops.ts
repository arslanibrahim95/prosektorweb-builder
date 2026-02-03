'use server'

import { getCloudflareService, getDefaultServerIp } from '@/server/integrations/cloudflare'
import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export interface OpsResult {
    success: boolean
    message?: string
    error?: string
    data?: any
}

// ==========================================
// HELPERS
// ==========================================
async function requireAdmin() {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }
}

// ==========================================
// PREVIEW SYSTEM
// ==========================================

export async function createPreview(projectId: string, subdomain: string, rootDomain: string = 'prosektorweb.com'): Promise<OpsResult> {
    try {
        await requireAdmin()

        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Cloudflare yapılandırılmamış' }
        }

        const serverIp = getDefaultServerIp()
        if (!serverIp) {
            return { success: false, error: 'Varsayılan sunucu IP adresi ayarlanmamış' }
        }

        // Create subdomain
        const result = await cf.createPreviewSubdomain(rootDomain, subdomain, serverIp)

        if (!result.success) {
            return { success: false, error: result.error }
        }

        // Update project
        await prisma.webProject.update({
            where: { id: projectId },
            data: { previewUrl: result.url }
        })

        revalidatePath(`/admin/projects/${projectId}`)
        return { success: true, message: 'Önizleme oluşturuldu', data: { url: result.url } }
    } catch (error) {
        console.error('createPreview error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Önizleme oluşturma hatası' }
    }
}

// ==========================================
// EMAIL SETUP
// ==========================================

export async function setupDomainEmail(projectId: string, forwardTo: string): Promise<OpsResult> {
    try {
        await requireAdmin()

        const project = await prisma.webProject.findUnique({
            where: { id: projectId },
            include: { domain: true }
        })

        if (!project || !project.domain) {
            return { success: false, error: 'Proje veya domain bulunamadı' }
        }

        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Cloudflare yapılandırılmamış' }
        }

        const zone = await cf.getZoneByName(project.domain.name)
        if (!zone) {
            return { success: false, error: 'Cloudflare zone bulunamadı' }
        }

        // 1. Enable Email Routing (adds MX records)
        const enableRes = await cf.enableEmailRouting(zone.id)
        if (!enableRes.success) {
            return { success: false, error: enableRes.error || "Hata" }
        }

        // 2. Create Rule: contact@domain -> forwardTo
        // We try 'info', 'iletisim', 'contact'
        const prefixes = ['info', 'iletisim', 'contact']
        const results = []

        for (const prefix of prefixes) {
            const email = `${prefix}@${project.domain.name}`
            const ruleRes = await cf.createEmailRule(zone.id, email, forwardTo)
            if (ruleRes.success) {
                results.push(email)
            }
        }

        if (results.length === 0) {
            return { success: false, error: 'Yönlendirme kuralları oluşturulamadı. Hedef adres doğrulanmamış olabilir.' }
        }

        revalidatePath(`/admin/projects/${projectId}`)
        return {
            success: true,
            message: `${results.join(', ')} adresleri yönlendirildi -> ${forwardTo}`
        }
    } catch (error) {
        console.error('setupDomainEmail error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'E-posta kurulum hatası' }
    }
}

// ==========================================
// DEPLOY TRIGGER (Simulation for now)
// ==========================================

export async function triggerDeploy(projectId: string): Promise<OpsResult> {
    try {
        await requireAdmin()
        // In a real scenario, this would SSH into the server or trigger a CI/CD pipeline
        // For now, we simulate the process

        // 1. Update status to DEPLOYING
        await prisma.webProject.update({
            where: { id: projectId },
            data: { status: 'DEPLOYING' }
        })

        revalidatePath(`/admin/projects/${projectId}`)

        // 2. Simulate delay
        // In real world, we'd return immediately and let a background job handle it

        return { success: true, message: 'Deploy işlemi başlatıldı' }
    } catch (error) {
        console.error('triggerDeploy error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Deploy başlatılamadı' }
    }
}
