export type DeploymentStatus = 'pending' | 'deployed' | 'failed';

export interface AAPanelConfig {
    webname: string; // JSON string formatında domain listesi
    path: string;
    type: 'PHP' | 'HTML';
    version: string;
    port: string;
    ps: string;
    ftp: 'false' | 'true';
    sql: 'false' | 'true';
    codeing: string;
}

export interface DNSConfig {
    domain: string;
    act: 'add' | 'delete' | 'modify';
    ns1domain?: string;
    ns2domain?: string;
    soa?: string;
}

export interface SiteManifest {
    version: string;
    company: {
        id: string;
        name: string;
    };
    domain: {
        primary: string;
        alternates?: string[];
    };
    status: DeploymentStatus;
    review?: {
        score: number;
        notes?: string[];
    };
    aapanel: AAPanelConfig;
    dns: DNSConfig;
    deployment?: {
        url?: string;
        deployed_at?: string;
        error?: string;
        success: boolean;
    };
}
