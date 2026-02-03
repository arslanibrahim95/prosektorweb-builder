import fs from 'fs/promises';
import path from 'path';
import { SiteManifest, AAPanelConfig, DNSConfig } from './types';

interface ExportOptions {
    domain: string;
    companyName: string;
    companyId: string;
    outputDir: string; // /root/generated_sites/
}

export class SiteExporter {
    /**
     * Creates a manifest.json file for site deployment.
     * The manifest contains all configuration needed for aaPanel deployment.
     */
    static async createManifest(options: ExportOptions): Promise<string> {
        const { domain, companyName, companyId, outputDir } = options;

        const aaPanelConfig: AAPanelConfig = {
            webname: JSON.stringify({ domain, domainlist: [], count: 0 }),
            path: `/www/wwwroot/${domain}`,
            type: 'PHP',
            version: '00',
            port: '80',
            ps: companyName,
            ftp: 'false',
            sql: 'false',
            codeing: 'utf8'
        };

        const dnsConfig: DNSConfig = {
            domain,
            act: 'add',
            ns1domain: '',
            ns2domain: '',
            soa: ''
        };

        const manifest: SiteManifest = {
            version: '1.0',
            company: { id: companyId, name: companyName },
            domain: { primary: domain },
            status: 'pending',
            aapanel: aaPanelConfig,
            dns: dnsConfig
        };

        const siteDir = path.join(outputDir, domain);
        await fs.mkdir(siteDir, { recursive: true });

        const manifestPath = path.join(siteDir, 'manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

        return manifestPath;
    }

    /**
     * Copies site files to the output directory.
     */
    static async copySiteFiles(
        sourceDir: string,
        domain: string,
        outputDir: string
    ): Promise<void> {
        const siteDir = path.join(outputDir, domain);
        await fs.mkdir(siteDir, { recursive: true });

        // Copy all files from source to site directory
        const files = await fs.readdir(sourceDir, { withFileTypes: true });

        for (const file of files) {
            const sourcePath = path.join(sourceDir, file.name);
            const destPath = path.join(siteDir, file.name);

            if (file.isDirectory()) {
                await fs.cp(sourcePath, destPath, { recursive: true });
            } else {
                await fs.copyFile(sourcePath, destPath);
            }
        }
    }
}
