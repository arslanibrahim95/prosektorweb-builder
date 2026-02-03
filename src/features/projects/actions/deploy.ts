'use server';

/**
 * Site Deploy Server Actions
 * Statik site oluşturma, Docker build ve Kubernetes deploy işlemleri
 */

import { prisma } from '@/server/db';
import { generateStaticSite } from '@/features/projects/lib/deploy/static-generator';
import { SiteExporter } from '@/features/projects/lib/deploy/exporter';
import { getCloudflareService, getDefaultServerIp } from '@/server/integrations/cloudflare';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';

// ================================
// TYPES
// ================================

interface DeployResult {
    success: boolean;
    previewUrl?: string;
    siteUrl?: string;
    pagesGenerated?: number;
    dockerImageUrl?: string;
    k8sDeploymentUrl?: string;
    error?: string;
}

interface ExportResult {
    success: boolean;
    outputPath?: string;
    files?: string[];
    error?: string;
}

interface DockerBuildResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

interface K8sDeployResult {
    success: boolean;
    namespace?: string;
    deploymentUrl?: string;
    error?: string;
}

// ================================
// CONSTANTS
// ================================

const OUTPUT_DIR = process.env.SITE_OUTPUT_DIR || '/tmp/generated_sites';
const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || 'preview.prosektorweb.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'ibrahimarslan';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'osgb';
const CONTAINER_REGISTRY = process.env.CONTAINER_REGISTRY || 'ghcr.io';
const K8S_CLUSTER_URL = process.env.K8S_CLUSTER_URL;
const K8S_TOKEN = process.env.K8S_TOKEN;

// ================================
// HELPERS
// ================================
async function requireAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required');
    }
}

function getProjectImageName(projectId: string): string {
    return `${CONTAINER_REGISTRY}/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}-site-${projectId}`;
}

// ================================
// DOCKER BUILD HELPER
// ================================

/**
 * GitHub Actions API ile Docker build workflow'u tetikle
 */
async function triggerDockerBuild(projectId: string): Promise<DockerBuildResult> {
    if (!GITHUB_TOKEN) {
        console.warn('GITHUB_TOKEN not configured, skipping Docker build');
        return { success: true }; // Soft failure
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/docker-build-site.yml/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: {
                        project_id: projectId,
                        site_domain: `${projectId}.preview.prosektorweb.com`,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('GitHub API error:', error);
            return { success: false, error: `GitHub API error: ${error}` };
        }

        const imageUrl = getProjectImageName(projectId);
        return {
            success: true,
            imageUrl: `${imageUrl}:latest`,
        };
    } catch (error) {
        console.error('Docker build trigger error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Docker build failed',
        };
    }
}

// ================================
// KUBERNETES DEPLOY HELPER
// ================================

/**
 * GitHub Actions API ile K8s deployment workflow'u tetikle
 */
async function triggerK8sDeploy(projectId: string, domain: string): Promise<K8sDeployResult> {
    if (!GITHUB_TOKEN) {
        console.warn('GITHUB_TOKEN not configured, skipping K8s deploy');
        return { success: true }; // Soft failure
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/deploy-k8s.yml/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: {
                        environment: 'production',
                        project_id: projectId,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('GitHub API error:', error);
            return { success: false, error: `GitHub API error: ${error}` };
        }

        return {
            success: true,
            namespace: `site-${projectId}`,
            deploymentUrl: `https://${domain}`,
        };
    } catch (error) {
        console.error('K8s deploy trigger error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'K8s deployment failed',
        };
    }
}

/**
 * Direct K8s API ile deployment yap (alternatif)
 */
async function directK8sDeploy(projectId: string, domain: string): Promise<K8sDeployResult> {
    if (!K8S_CLUSTER_URL || !K8S_TOKEN) {
        console.warn('K8s credentials not configured');
        return { success: false, error: 'K8s credentials not configured' };
    }

    try {
        const namespace = `site-${projectId}`;
        const imageUrl = getProjectImageName(projectId);

        // Create namespace
        const nsResponse = await fetch(`${K8S_CLUSTER_URL}/api/v1/namespaces`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${K8S_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiVersion: 'v1',
                kind: 'Namespace',
                metadata: { name: namespace },
            }),
        });

        // Create deployment
        const deploymentManifest = {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: { name: `site-${projectId}`, namespace },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: { app: `site-${projectId}` },
                },
                template: {
                    metadata: { labels: { app: `site-${projectId}` } },
                    spec: {
                        containers: [{
                            name: 'nginx',
                            image: `${imageUrl}:latest`,
                            ports: [{ containerPort: 80 }],
                        }],
                    },
                },
            },
        };

        const deployResponse = await fetch(`${K8S_CLUSTER_URL}/apis/apps/v1/namespaces/${namespace}/deployments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${K8S_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deploymentManifest),
        });

        if (!deployResponse.ok && deployResponse.status !== 409) {
            throw new Error('Deployment creation failed');
        }

        return {
            success: true,
            namespace,
            deploymentUrl: `https://${domain}`,
        };
    } catch (error) {
        console.error('Direct K8s deploy error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'K8s deployment failed',
        };
    }
}

// ================================
// SERVER ACTIONS
// ================================

/**
 * Statik siteyi oluştur ve dosya sistemine kaydet
 */
export async function exportSite(projectId: string): Promise<ExportResult> {
    try {
        await requireAdmin();

        // 1. Site içeriklerini oluştur
        const result = await generateStaticSite(projectId);

        if (!result.success || !result.pages) {
            return { success: false, error: result.error || 'Site oluşturulamadı' };
        }

        // 2. Proje bilgilerini al
        const project = await prisma.webProject.findUnique({
            where: { id: projectId },
            include: { company: true, domain: true },
        });

        if (!project) {
            return { success: false, error: 'Proje bulunamadı' };
        }

        const domain = project.domain?.name || `${project.id}.preview`;

        // Sanitize path components to prevent traversal
        const safeDomain = path.basename(domain);
        const siteDir = path.join(OUTPUT_DIR, safeDomain);

        // 3. Klasör oluştur
        await fs.mkdir(siteDir, { recursive: true });

        // 4. Dosyaları yaz
        const files: string[] = [];
        for (const page of result.pages) {
            // Path normalization security fix
            const safeFilename = path.basename(page.filename);
            const filePath = path.join(siteDir, safeFilename);
            await fs.writeFile(filePath, page.content, 'utf-8');
            files.push(safeFilename);
        }

        // 5. Manifest oluştur
        await SiteExporter.createManifest({
            domain: safeDomain,
            companyName: project.company.name,
            companyId: project.company.id,
            outputDir: OUTPUT_DIR,
        });

        // 6. Proje durumunu güncelle
        await prisma.webProject.update({
            where: { id: projectId },
            data: {
                status: 'REVIEW',
                previewUrl: `https://${project.id}.${PREVIEW_DOMAIN}`,
            },
        });

        revalidatePath(`/admin/projects/${projectId}`);

        return {
            success: true,
            outputPath: siteDir,
            files,
        };
    } catch (error) {
        console.error('exportSite error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Export hatası',
        };
    }
}

/**
 * Preview subdomain oluştur (Cloudflare) + Docker build
 */
export async function createPreview(projectId: string): Promise<DeployResult> {
    try {
        await requireAdmin();

        // 1. Önce siteyi export et
        const exportResult = await exportSite(projectId);

        if (!exportResult.success) {
            return { success: false, error: exportResult.error };
        }

        // 2. Proje bilgilerini al
        const project = await prisma.webProject.findUnique({
            where: { id: projectId },
            include: { company: true, domain: true },
        });

        if (!project) {
            return { success: false, error: 'Proje bulunamadı' };
        }

        // 3. Cloudflare servisini al
        const cf = await getCloudflareService();
        const serverIp = getDefaultServerIp();
        let previewUrl = `file://${exportResult.outputPath}/index.html`;

        if (cf && serverIp) {
            // 4. Preview subdomain oluştur
            const result = await cf.createPreviewSubdomain(
                PREVIEW_DOMAIN,
                projectId.slice(0, 8),
                serverIp
            );

            if (result.success && result.url) {
                previewUrl = result.url;
                await prisma.webProject.update({
                    where: { id: projectId },
                    data: { previewUrl: result.url },
                });
            }
        }

        // 5. Docker build tetikle (background)
        const dockerResult = await triggerDockerBuild(projectId);

        revalidatePath(`/admin/projects/${projectId}`);

        return {
            success: true,
            pagesGenerated: exportResult.files?.length || 0,
            previewUrl,
            dockerImageUrl: dockerResult.imageUrl,
        };
    } catch (error) {
        console.error('createPreview error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Preview oluşturulamadı',
        };
    }
}

/**
 * Siteyi canlıya al (Production deploy) + Docker + K8s
 */
export async function deploySite(projectId: string): Promise<DeployResult> {
    try {
        await requireAdmin();

        const project = await prisma.webProject.findUnique({
            where: { id: projectId },
            include: { domain: true, company: true },
        });

        if (!project) {
            return { success: false, error: 'Proje bulunamadı' };
        }

        if (!project.domain) {
            return { success: false, error: 'Domain atanmamış' };
        }

        // 1. Siteyi export et (henüz yoksa)
        const exportResult = await exportSite(projectId);
        if (!exportResult.success) {
            return { success: false, error: exportResult.error };
        }

        // 2. Docker build tetikle
        const dockerResult = await triggerDockerBuild(projectId);

        // 3. Cloudflare DNS kayıtları
        const cf = await getCloudflareService();
        if (cf) {
            const serverIp = getDefaultServerIp();
            if (serverIp) {
                const zone = await cf.getZoneByName(project.domain.name);
                if (zone) {
                    await cf.createStandardWebsiteDns(zone.id, project.domain.name, serverIp);
                }
            }
        }

        // 4. K8s deployment tetikle
        const k8sResult = await triggerK8sDeploy(projectId, project.domain.name);

        // 5. Proje durumunu güncelle
        await prisma.webProject.update({
            where: { id: projectId },
            data: {
                status: 'LIVE',
                siteUrl: `https://${project.domain.name}`,
                completedAt: new Date(),
            },
        });

        // 6. Domain durumunu güncelle
        await prisma.domain.update({
            where: { id: project.domain.id },
            data: { status: 'ACTIVE' },
        });

        revalidatePath(`/admin/projects/${projectId}`);

        return {
            success: true,
            siteUrl: `https://${project.domain.name}`,
            pagesGenerated: exportResult.files?.length || 0,
            dockerImageUrl: dockerResult.imageUrl,
            k8sDeploymentUrl: k8sResult.deploymentUrl,
        };
    } catch (error) {
        console.error('deploySite error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Deploy hatası',
        };
    }
}

/**
 * Proje için site durumunu kontrol et
 */
export async function getSiteStatus(projectId: string) {
    try {
        const session = await auth();
        if (!session) return null;

        // Get project
        const project = await prisma.webProject.findUnique({
            where: { id: projectId },
            include: {
                domain: true,
                generatedContents: {
                    select: {
                        contentType: true,
                        status: true,
                    },
                },
                company: {
                    select: { id: true }
                }
            },
        });

        if (!project) return null;

        // Tenant Check (Eğer admin değilse sadece kendi şirketinin projesini görebilir)
        if (session.user?.role !== 'ADMIN') {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            if (!user?.companyId || user.companyId !== project.company.id) {
                return null;
            }
        }

        const approvedCount = project.generatedContents.filter(
            (c: { status: string }) => c.status === 'APPROVED'
        ).length;

        const totalCount = project.generatedContents.length;

        return {
            projectId,
            status: project.status,
            domain: project.domain?.name,
            previewUrl: project.previewUrl,
            siteUrl: project.siteUrl,
            contentStats: {
                total: totalCount,
                approved: approvedCount,
                ready: approvedCount >= 3, // En az 3 sayfa onaylı olmalı
            },
        };

    } catch (error) {
        return null;
    }
}

/**
 * Docker build durumunu kontrol et
 */
export async function getDockerBuildStatus(projectId: string) {
    if (!GITHUB_TOKEN) {
        return { enabled: false };
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/docker-build-site.yml/runs?event=workflow_dispatch&per_page=1`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            }
        );

        if (!response.ok) {
            return { enabled: true, status: 'unknown' };
        }

        const data = await response.json();
        const latestRun = data.workflow_runs?.[0];

        return {
            enabled: true,
            status: latestRun?.status || 'completed',
            conclusion: latestRun?.conclusion,
            runId: latestRun?.id,
        };
    } catch (error) {
        return { enabled: true, status: 'error' };
    }
}
